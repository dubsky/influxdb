package migrations

import (
	"context"

	"github.com/influxdata/influxdb/v2/kv"
	"github.com/influxdata/influxdb/v2/kv/migration"
	"go.uber.org/zap"
)

// Up applies all influxdb metadata store migrations to the supplied kv.SchemaStore
func Up(ctx context.Context, log *zap.Logger, store kv.SchemaStore, service *kv.Service) error {
	migrator, err := Compose(log, store, service)
	if err != nil {
		return err
	}

	return migrator.Up(ctx)
}

// Compose is the list of migrations currently run to build influxdb's metadata store
// It is a list which should be appended to (only) with ongoing migrations to metadata
// store within a kv.Store.
func Compose(log *zap.Logger, store kv.SchemaStore, service *kv.Service) (*migration.Migrator, error) {
	return migration.NewMigrator(
		log,
		store,
		// first migration is the kv.Service itself
		service,
		// add index user resource mappings by user id
		kv.NewIndexMigration(kv.URMByUserIndexMapping, store, kv.WithIndexMigrationCleanup),
		// and new migrations below here (and move this comment down):
	)
}
