package kv

import (
	"context"
	"time"

	"github.com/benbjohnson/clock"
	"github.com/influxdata/influxdb/v2"
	"github.com/influxdata/influxdb/v2/rand"
	"github.com/influxdata/influxdb/v2/resource"
	"github.com/influxdata/influxdb/v2/resource/noop"
	"github.com/influxdata/influxdb/v2/snowflake"
	"go.uber.org/zap"
)

var (
	_ influxdb.UserService = (*Service)(nil)
)

// OpPrefix is the prefix for kv errors.
const OpPrefix = "kv/"

// Service is the struct that influxdb services are implemented on.
type Service struct {
	kv          SchemaStore
	log         *zap.Logger
	clock       clock.Clock
	Config      ServiceConfig
	audit       resource.Logger
	IDGenerator influxdb.IDGenerator

	// FluxLanguageService is used for parsing flux.
	// If this is unset, operations that require parsing flux
	// will fail.
	FluxLanguageService influxdb.FluxLanguageService

	// special ID generator that never returns bytes with backslash,
	// comma, or space. Used to support very specific encoding of org &
	// bucket into the old measurement in storage.
	OrgBucketIDs influxdb.IDGenerator

	TokenGenerator influxdb.TokenGenerator
	// TODO(desa:ariel): this should not be embedded
	influxdb.TimeGenerator
	Hash Crypt

	checkStore    *IndexStore
	endpointStore *IndexStore
	variableStore *IndexStore

	urmByUserIndex *Index

	disableAuthorizationsForMaxPermissions func(context.Context) bool
}

// NewService returns an instance of a Service.
func NewService(log *zap.Logger, kv SchemaStore, configs ...ServiceConfig) *Service {
	s := &Service{
		log:         log,
		IDGenerator: snowflake.NewIDGenerator(),
		// Seed the random number generator with the current time
		OrgBucketIDs:   rand.NewOrgBucketID(time.Now().UnixNano()),
		TokenGenerator: rand.NewTokenGenerator(64),
		Hash:           &Bcrypt{},
		kv:             kv,
		audit:          noop.ResourceLogger{},
		TimeGenerator:  influxdb.RealTimeGenerator{},
		checkStore:     newCheckStore(),
		endpointStore:  newEndpointStore(),
		variableStore:  newVariableStore(),
		urmByUserIndex: NewIndex(URMByUserIndexMapping, WithIndexReadPathEnabled),
		disableAuthorizationsForMaxPermissions: func(context.Context) bool {
			return false
		},
	}

	if len(configs) > 0 {
		s.Config = configs[0]
	}

	if s.Config.SessionLength == 0 {
		s.Config.SessionLength = influxdb.DefaultSessionLength
	}

	s.clock = s.Config.Clock
	if s.clock == nil {
		s.clock = clock.New()
	}
	s.FluxLanguageService = s.Config.FluxLanguageService

	return s
}

// ServiceConfig allows us to configure Services
type ServiceConfig struct {
	SessionLength       time.Duration
	Clock               clock.Clock
	FluxLanguageService influxdb.FluxLanguageService
}

// MigrationName returns the string initial migration
// which allows this store to be used as a migration
func (s *Service) MigrationName() string {
	return "initial migration"
}

// Up initializes all the owned buckets of the underlying store
func (s *Service) Up(ctx context.Context) error {
	// please do not initialize anymore buckets here
	// add them as a new migration to the list of migrations
	// defined in NewService.

	for _, createBuckets := range []func(context.Context, BucketCreator) error{
		s.createAuthBuckets,
		s.createDocumentBuckets,
		s.createBucketBuckets,
		s.createDashboardBuckets,
		s.createKVLogBuckets,
		s.createLabelBuckets,
		s.createOnboardingBuckets,
		s.createOrganizationBuckets,
		s.createTaskBuckets,
		s.createPasswordBuckets,
		s.createScraperBuckets,
		s.createSecretBuckets,
		s.createSessionBuckets,
		s.createSourceBuckets,
		s.createTelegrafBuckets,
		s.createURMBuckets,
		s.createVariablesOrgIndexBuckets,
		s.variableStore.Init,
		s.checkStore.Init,
		s.endpointStore.Init,
		s.createNotificationRuleBuckets,
		s.createUserBuckets,
	} {
		if err := createBuckets(ctx, s.kv); err != nil {
			return err
		}
	}

	if err := s.kv.Update(ctx, func(tx Tx) error {
		// seed initial sources (default source)
		return s.initializeSources(ctx, tx)
	}); err != nil {
		return err
	}

	return nil
}

// Down is a no operation required for service to be used as a migration
func (s *Service) Down(context.Context) error {
	return nil
}

// WithResourceLogger sets the resource audit logger for the service.
func (s *Service) WithResourceLogger(audit resource.Logger) {
	s.audit = audit
}

// WithStore sets kv store for the service.
// Should only be used in tests for mocking.
func (s *Service) WithStore(store SchemaStore) {
	s.kv = store
}

// WithSpecialOrgBucketIDs sets the generator for the org
// and bucket ids.
//
// Should only be used in tests for mocking.
func (s *Service) WithSpecialOrgBucketIDs(gen influxdb.IDGenerator) {
	s.OrgBucketIDs = gen
}

// WithMaxPermissionFunc sets the useAuthorizationsForMaxPermissions function
// which can trigger whether or not max permissions uses the users authorizations
// to derive maximum permissions.
func (s *Service) WithMaxPermissionFunc(fn func(context.Context) bool) {
	s.disableAuthorizationsForMaxPermissions = fn
}
