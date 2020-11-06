package upgrade

// Security upgrade implementation.
// Creates tokens representing v1 users.

import (
	"context"
	"errors"
	"fmt"
	"sort"

	platform "github.com/influxdata/influxdb/v2"
	"github.com/influxdata/influxdb/v2/v1/services/meta"
	"github.com/influxdata/influxql"
	"go.uber.org/zap"
)

// upgradeUsers creates tokens representing v1 users.
func upgradeUsers(ctx context.Context, v1 *influxDBv1, v2 *influxDBv2, targetOptions *optionsV2, dbBuckets map[string][]platform.ID, log *zap.Logger) error {
	// check if there any 1.x users at all
	v1meta := v1.meta
	if len(v1meta.Users()) == 0 {
		log.Info("There are no users in 1.x, nothing to upgrade.")
		return nil
	}

	// get helper instance
	helper := newSecurityScriptHelper(log)

	// check if target buckets exists in 2.x
	proceed := helper.checkDbBuckets(v1meta, dbBuckets)
	if !proceed {
		return errors.New("upgrade: there were errors/warnings, please fix them and run the command again")
	}

	// upgrade users
	for _, row := range helper.sortUserInfo(v1meta.Users()) {
		username := row.Name
		if row.Admin {
			log.Info("User is admin and will not be upgraded.", zap.String("username", username))
		} else if len(row.Privileges) == 0 {
			log.Info("User has no privileges and will not be upgraded.", zap.String("username", username))
		} else {
			var dbList []string
			for database := range row.Privileges {
				dbList = append(dbList, database)
			}
			var permissions []platform.Permission
			for _, database := range dbList {
				permission := row.Privileges[database]
				for _, id := range dbBuckets[database] {
					switch permission {
					case influxql.ReadPrivilege:
						p, err := platform.NewPermissionAtID(id, platform.ReadAction, platform.BucketsResourceType, targetOptions.orgID)
						if err != nil {
							return err
						}
						permissions = append(permissions, *p)
					case influxql.WritePrivilege:
						p, err := platform.NewPermissionAtID(id, platform.WriteAction, platform.BucketsResourceType, targetOptions.orgID)
						if err != nil {
							return err
						}
						permissions = append(permissions, *p)
					case influxql.AllPrivileges:
						p, err := platform.NewPermissionAtID(id, platform.ReadAction, platform.BucketsResourceType, targetOptions.orgID)
						if err != nil {
							return err
						}
						permissions = append(permissions, *p)
						p, err = platform.NewPermissionAtID(id, platform.WriteAction, platform.BucketsResourceType, targetOptions.orgID)
						if err != nil {
							return err
						}
						permissions = append(permissions, *p)
					}
				}
			}
			if len(permissions) > 0 {
				auth := &platform.Authorization{
					Description: username + "'s Token",
					Permissions: permissions,
					Token:       username,
					OrgID:       targetOptions.orgID,
					UserID:      targetOptions.userID,
				}
				err := v2.authSvc.CreateAuthorization(ctx, auth)
				if err != nil {
					log.Error("Failed to create authorization.", zap.String("user", username), zap.Error(err))
					continue
				}
				err = v2.authSvc.SetPasswordHash(ctx, auth.ID, row.Hash)
				if err != nil {
					log.Error("Failed to set user's password.", zap.String("user", username), zap.Error(err))
					continue
				}
				log.Info("User upgraded.", zap.String("username", username))
			} else {
				log.Info("User has no privileges and will not be upgraded.", zap.String("username", username))
			}
		}
	}

	return nil
}

// securityScriptHelper is a helper used by `generate-security-script` command.
type securityScriptHelper struct {
	log *zap.Logger
}

// newSecurityScriptHelper returns new security script helper instance for `generate-security-script` command.
func newSecurityScriptHelper(log *zap.Logger) *securityScriptHelper {
	helper := &securityScriptHelper{
		log: log,
	}

	return helper
}
func (h *securityScriptHelper) checkDbBuckets(meta *meta.Client, databases map[string][]platform.ID) bool {
	ok := true
	for _, row := range meta.Users() {
		for database := range row.Privileges {
			if database == "_internal" {
				continue
			}
			ids := databases[database]
			if len(ids) == 0 {
				h.log.Warn(fmt.Sprintf("No buckets for database [%s] exist in 2.x.", database))
				ok = false
			}
		}
	}

	return ok
}

func (h *securityScriptHelper) sortUserInfo(info []meta.UserInfo) []meta.UserInfo {
	sort.Slice(info, func(i, j int) bool {
		return info[i].Name < info[j].Name
	})
	return info
}
