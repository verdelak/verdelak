using Verdelak.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Verdelak.Api.Data
{
    using Verdelak.Api.Models;
    using Microsoft.EntityFrameworkCore;
    using System.Collections.Generic;

    public class VerdelakDbContext : DbContext
    {
        public VerdelakDbContext(DbContextOptions<VerdelakDbContext> options) : base(options) { }

        public DbSet<RPGProduct> RPGProducts => Set<RPGProduct>();
        public DbSet<RPGProductType> RPGProductTypes => Set<RPGProductType>();
        public DbSet<RPGSystem> RPGSystems => Set<RPGSystem>();
        public DbSet<RPGSeries> RPGSeries => Set<RPGSeries>();
        public DbSet<RPGSystemNote> RPGSystemNotes => Set<RPGSystemNote>();
        public DbSet<RPGSeriesNote> RPGSeriesNotes => Set<RPGSeriesNote>();

        public DbSet<ScheduledTask> ScheduledTasks { get; set; }
        public DbSet<TaskOccurrence> TaskOccurrences { get; set; }
        public DbSet<BackupSource> BackupSources { get; set; }
        public DbSet<BackupDestination> BackupDestinations { get; set; }
        public DbSet<BackupJob> BackupJobs { get; set; }

        public DbSet<ScheduledTaskTag> ScheduledTaskTags { get; set; }
        public DbSet<BackupJobLog> BackupJobLogs { get; set; }
        public DbSet<SchedulerRunHistory> SchedulerRunHistory { get; set; }
        public DbSet<FishTank> FishTanks => Set<FishTank>();
        public DbSet<FishTankLog> FishTankLogs => Set<FishTankLog>();
        public DbSet<FishStock> FishStock => Set<FishStock>();
        public DbSet<FishSpeciesProfile> FishSpeciesProfiles => Set<FishSpeciesProfile>();
        public DbSet<FishSpeciesFood> FishSpeciesFoods => Set<FishSpeciesFood>();
        public DbSet<FishTankTask> FishTankTasks => Set<FishTankTask>();
        public DbSet<FishLivestockEvent> FishLivestockEvents => Set<FishLivestockEvent>();
        public DbSet<FishAquariumProduct> FishAquariumProducts => Set<FishAquariumProduct>();
        public DbSet<FishAquariumProductUsage> FishAquariumProductUsage => Set<FishAquariumProductUsage>();
        public DbSet<AppSetting> AppSettings => Set<AppSetting>();
        public DbSet<ShoppingListItem> ShoppingListItems => Set<ShoppingListItem>();
        public DbSet<ShoppingItemDefault> ShoppingItemDefaults => Set<ShoppingItemDefault>();
        public DbSet<PantryItem> PantryItems => Set<PantryItem>();

        public DbSet<Spookytown> Spookytown { get; set; } = default!;
        public DbSet<SpookytownType> SpookytownType { get; set; } = default!;

        public DbSet<Link> Links { get; set; }
        public DbSet<LinkTopic> LinkTopics { get; set; }
        public DbSet<LinkSubTopic> LinkSubTopics { get; set; }

        public DbSet<MusicArtist> MusicArtist => Set<MusicArtist>();
        public DbSet<MusicAlbum> Albums => Set<MusicAlbum>();
        public DbSet<MusicAlbumInfo> MusicAlbumInfos => Set<MusicAlbumInfo>();
        public DbSet<MusicAlbumStatus> MusicAlbumStatuses => Set<MusicAlbumStatus>();
        public DbSet<MusicArtistBio> MusicArtistBios => Set<MusicArtistBio>();

        public DbSet<Review> Reviews => Set<Review>();

        public DbSet<Location> Locations { get; set; }
        public DbSet<HomeInventoryItem> HomeInventoryItems { get; set; }
        public DbSet<HomeInventoryImage> HomeInventoryImages { get; set; }
        public DbSet<HomeInventoryNote> HomeInventoryNotes { get; set; }

        public DbSet<Game> Games { get; set; }
        public DbSet<GamePlay> GamePlays { get; set; }

        public DbSet<AppUser> appUsers => Set<AppUser>();
        public DbSet<BarcodeStagingItem> BarcodeStagingItems => Set<BarcodeStagingItem>();
        public DbSet<BarcodeLookupCandidate> BarcodeLookupCandidates => Set<BarcodeLookupCandidate>();
        public DbSet<ExternalImportBatch> ExternalImportBatches => Set<ExternalImportBatch>();
        public DbSet<ExternalImportStagingItem> ExternalImportStagingItems => Set<ExternalImportStagingItem>();
        public DbSet<BlogPost> BlogPosts => Set<BlogPost>();
        public DbSet<BlogTag> BlogTags => Set<BlogTag>();
        public DbSet<BlogPostTag> BlogPostTags => Set<BlogPostTag>();
        public DbSet<Recipe> Recipes => Set<Recipe>();
        public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();
        public DbSet<RecipeInstruction> RecipeInstructions => Set<RecipeInstruction>();
        public DbSet<RecipeTag> RecipeTags => Set<RecipeTag>();
        public DbSet<RecipeTagLink> RecipeTagLinks => Set<RecipeTagLink>();
        public DbSet<RecipeBook> RecipeBooks => Set<RecipeBook>();
        public DbSet<ResumeProfile> ResumeProfiles => Set<ResumeProfile>();
        public DbSet<ResumeItem> ResumeItems => Set<ResumeItem>();
        public DbSet<Book> Books => Set<Book>();
        public DbSet<BookAuthor> BookAuthors => Set<BookAuthor>();
        public DbSet<BookFormat> BookFormats => Set<BookFormat>();
        public DbSet<BookSeries> BookSeries => Set<BookSeries>();
        public DbSet<BookSubSeries> BookSubSeries => Set<BookSubSeries>();
        public DbSet<BookStatus> BookStatuses => Set<BookStatus>();
        public DbSet<ChessexCategory> ChessexCategories => Set<ChessexCategory>();
        public DbSet<ChessexSetType> ChessexSetTypes => Set<ChessexSetType>();
        public DbSet<ChessexSet> ChessexSets => Set<ChessexSet>();
        public DbSet<MtgCard> MtgCards => Set<MtgCard>();
        public DbSet<MtgPrinting> MtgPrintings => Set<MtgPrinting>();
        public DbSet<MtgCollectionItem> MtgCollectionItems => Set<MtgCollectionItem>();
        public DbSet<DiceGameItem> DiceGameItems => Set<DiceGameItem>();
        public DbSet<DragonDiceItem> DragonDiceItems => Set<DragonDiceItem>();
        public DbSet<Contact> Contacts => Set<Contact>();
        public DbSet<ContactPhone> ContactPhones => Set<ContactPhone>();
        public DbSet<ContactEmail> ContactEmails => Set<ContactEmail>();
        public DbSet<ContactPhoneType> ContactPhoneTypes => Set<ContactPhoneType>();
        public DbSet<ContactTypeLookup> ContactTypes => Set<ContactTypeLookup>();
        public DbSet<ToyCompany> ToyCompanies => Set<ToyCompany>();
        public DbSet<ToyLine> ToyLines => Set<ToyLine>();
        public DbSet<ToySeries> ToySeries => Set<ToySeries>();
        public DbSet<ToyLineSeries> ToyLineSeries => Set<ToyLineSeries>();
        public DbSet<ToyFigure> ToyFigures => Set<ToyFigure>();
        public DbSet<Software> Software => Set<Software>();
        public DbSet<SoftwarePlatform> SoftwarePlatforms => Set<SoftwarePlatform>();
        public DbSet<SoftwareLocation> SoftwareLocations => Set<SoftwareLocation>();
        public DbSet<ShowSeries> ShowSeries => Set<ShowSeries>();
        public DbSet<ShowSeason> ShowSeasons => Set<ShowSeason>();
        public DbSet<ShowBoxSet> ShowBoxSets => Set<ShowBoxSet>();
        public DbSet<ShowBoxSetSeason> ShowBoxSetSeasons => Set<ShowBoxSetSeason>();
        public DbSet<MiniCompany> MiniCompanies => Set<MiniCompany>();
        public DbSet<MiniSystem> MiniSystems => Set<MiniSystem>();
        public DbSet<MiniSeries> MiniSeries => Set<MiniSeries>();
        public DbSet<Miniature> Miniatures => Set<Miniature>();
        public DbSet<MiniStatus> MiniStatuses => Set<MiniStatus>();
        public DbSet<MiniSystemRelease> MiniSystemReleases => Set<MiniSystemRelease>();
        public DbSet<MiniValue> MiniValues => Set<MiniValue>();
        public DbSet<FinanceAccountBalance> FinanceAccountBalances => Set<FinanceAccountBalance>();
        public DbSet<FinanceAccountBalanceHistory> FinanceAccountBalanceHistory => Set<FinanceAccountBalanceHistory>();
        public DbSet<FinanceRecurringBill> FinanceRecurringBills => Set<FinanceRecurringBill>();
        public DbSet<FinanceRecurringBillPayment> FinanceRecurringBillPayments => Set<FinanceRecurringBillPayment>();
        public DbSet<FinanceYearSnapshot> FinanceYearSnapshots => Set<FinanceYearSnapshot>();
        public DbSet<FinanceDonation> FinanceDonations => Set<FinanceDonation>();
        public DbSet<MagazineSeries> MagazineSeries => Set<MagazineSeries>();
        public DbSet<Magazine> Magazines => Set<Magazine>();
        public DbSet<MovieInventoryItem> MovieInventoryItems => Set<MovieInventoryItem>();
        public DbSet<AlcoholItem> AlcoholItems => Set<AlcoholItem>();
        public DbSet<AlcoholProduct> AlcoholProducts => Set<AlcoholProduct>();
        public DbSet<AlcoholCategory> AlcoholCategories => Set<AlcoholCategory>();
        public DbSet<AlcoholType> AlcoholTypes => Set<AlcoholType>();
        public DbSet<AlcoholStyle> AlcoholStyles => Set<AlcoholStyle>();
        public DbSet<AlcoholRegion> AlcoholRegions => Set<AlcoholRegion>();
        public DbSet<AlcoholLocation> AlcoholLocations => Set<AlcoholLocation>();
        public DbSet<AlcoholCount> AlcoholCounts => Set<AlcoholCount>();
        public DbSet<AlcoholRating> AlcoholRatings => Set<AlcoholRating>();
        public DbSet<AlcoholValue> AlcoholValues => Set<AlcoholValue>();
        public DbSet<DinoTaxonomyNode> DinoTaxonomyNodes => Set<DinoTaxonomyNode>();
        public DbSet<DinosaurEntry> DinosaurEntries => Set<DinosaurEntry>();
        public DbSet<DinoContentSection> DinoContentSections => Set<DinoContentSection>();
        public DbSet<DinoIllustration> DinoIllustrations => Set<DinoIllustration>();
        public DbSet<GardenSeed> GardenSeeds => Set<GardenSeed>();
        public DbSet<GardenSeedInventory> GardenSeedInventory => Set<GardenSeedInventory>();
        public DbSet<GardenSeedTray> GardenSeedTrays => Set<GardenSeedTray>();
        public DbSet<GardenSeedTrayDimension> GardenSeedTrayDimensions => Set<GardenSeedTrayDimension>();
        public DbSet<GardenSeedTrayPlant> GardenSeedTrayPlants => Set<GardenSeedTrayPlant>();
        public DbSet<GardenPlot> GardenPlots => Set<GardenPlot>();
        public DbSet<GardenPlotDimension> GardenPlotDimensions => Set<GardenPlotDimension>();
        public DbSet<GardenPlotPlant> GardenPlotPlants => Set<GardenPlotPlant>();
        public DbSet<GardenNote> GardenNotes => Set<GardenNote>();
        public DbSet<GardenHarvest> GardenHarvests => Set<GardenHarvest>();
        public DbSet<ComicSeries> ComicSeries => Set<ComicSeries>();
        public DbSet<ComicIssue> ComicIssues => Set<ComicIssue>();
        public DbSet<ComicStatus> ComicStatuses => Set<ComicStatus>();
        public DbSet<ComicValue> ComicValues => Set<ComicValue>();
        public DbSet<AnnualPlan> AnnualPlans => Set<AnnualPlan>();
        public DbSet<PlanItem> PlanItems => Set<PlanItem>();
        public DbSet<PlanItemPredecessor> PlanItemPredecessors => Set<PlanItemPredecessor>();
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            modelBuilder.Entity<DiceGameItem>(e =>
            {
                e.ToTable("DiceGameItems");
                e.HasKey(x => x.Id);
                e.Property(x => x.GameName).IsRequired().HasMaxLength(100).HasDefaultValue("D&D Dice Masters");
                e.Property(x => x.SetName).IsRequired().HasMaxLength(150);
                e.Property(x => x.CardId).HasMaxLength(50);
                e.Property(x => x.CardNumber).HasMaxLength(50);
                e.Property(x => x.CardName).IsRequired().HasMaxLength(200);
                e.Property(x => x.Subtitle).HasMaxLength(250);
                e.Property(x => x.EnergyType).HasMaxLength(50);
                e.Property(x => x.Alignment).HasMaxLength(50);
                e.Property(x => x.Equippable).HasMaxLength(50);
                e.Property(x => x.Rarity).HasMaxLength(100);
                e.Property(x => x.StatusID).IsRequired().HasMaxLength(5).HasDefaultValue("H");
                e.Property(x => x.Notes).HasMaxLength(2000);
                e.Property(x => x.SourceSheet).HasMaxLength(100);
                e.Property(x => x.SourceRowLabel).HasMaxLength(100);
                e.HasIndex(x => x.GameName);
                e.HasIndex(x => x.SetName);
                e.HasIndex(x => x.CardName);
                e.HasIndex(x => x.Rarity);
                e.HasIndex(x => x.StatusID);
                e.HasIndex(x => x.SourceSheet);
            });

            modelBuilder.Entity<ExternalImportBatch>(e =>
            {
                e.ToTable("ExternalImportBatches");
                e.HasKey(x => x.Id);
                e.Property(x => x.Source).IsRequired().HasMaxLength(50);
                e.Property(x => x.TargetArea).IsRequired().HasMaxLength(50);
                e.Property(x => x.BatchName).IsRequired().HasMaxLength(100);
                e.Property(x => x.Status).IsRequired().HasMaxLength(30).HasDefaultValue("Open");
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.Property(x => x.CreatedAtUtc).HasDefaultValueSql("SYSUTCDATETIME()");
                e.HasIndex(x => x.Source);
                e.HasIndex(x => x.TargetArea);
                e.HasIndex(x => x.Status);
                e.HasIndex(x => x.CreatedAtUtc);
            });

            modelBuilder.Entity<ExternalImportStagingItem>(e =>
            {
                e.ToTable("ExternalImportStagingItems");
                e.HasKey(x => x.Id);
                e.Property(x => x.Source).IsRequired().HasMaxLength(50);
                e.Property(x => x.TargetArea).IsRequired().HasMaxLength(50);
                e.Property(x => x.ExternalId).HasMaxLength(150);
                e.Property(x => x.Title).IsRequired().HasMaxLength(250);
                e.Property(x => x.PlatformName).HasMaxLength(100);
                e.Property(x => x.LocationName).HasMaxLength(100);
                e.Property(x => x.Publisher).HasMaxLength(250);
                e.Property(x => x.Developer).HasMaxLength(250);
                e.Property(x => x.VersionEdition).HasMaxLength(250);
                e.Property(x => x.MediaType).HasMaxLength(100);
                e.Property(x => x.ArtworkUrl).HasMaxLength(500);
                e.Property(x => x.Status).IsRequired().HasMaxLength(30).HasDefaultValue("Staged");
                e.Property(x => x.MatchStatus).IsRequired().HasMaxLength(30).HasDefaultValue("NotChecked");
                e.Property(x => x.SelectedAction).IsRequired().HasMaxLength(30).HasDefaultValue("Import");
                e.Property(x => x.MatchedEntityType).HasMaxLength(50);
                e.Property(x => x.MatchedTitle).HasMaxLength(250);
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.Property(x => x.ImportedEntityType).HasMaxLength(50);
                e.Property(x => x.CreatedAtUtc).HasDefaultValueSql("SYSUTCDATETIME()");
                e.HasOne(x => x.Batch)
                    .WithMany(x => x.Items)
                    .HasForeignKey(x => x.BatchId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.BatchId);
                e.HasIndex(x => x.Source);
                e.HasIndex(x => x.TargetArea);
                e.HasIndex(x => x.ExternalId);
                e.HasIndex(x => x.Title);
                e.HasIndex(x => x.Status);
                e.HasIndex(x => x.MatchStatus);
                e.HasIndex(x => x.SelectedAction);
            });

            modelBuilder.Entity<DragonDiceItem>(e =>
            {
                e.ToTable("DragonDiceItems");
                e.HasKey(x => x.Id);
                e.Property(x => x.DieName).IsRequired().HasMaxLength(200);
                e.Property(x => x.RaceOrSpecies).HasMaxLength(150);
                e.Property(x => x.Role).HasMaxLength(150);
                e.Property(x => x.DieType).HasMaxLength(100);
                e.Property(x => x.Health).HasMaxLength(50);
                e.Property(x => x.Points).HasMaxLength(50);
                e.Property(x => x.StatusID).IsRequired().HasMaxLength(5).HasDefaultValue("H");
                e.Property(x => x.NoteCode).HasMaxLength(25);
                e.Property(x => x.Notes).HasMaxLength(2000);
                e.Property(x => x.SourceSheet).HasMaxLength(100);
                e.Property(x => x.SourceRowLabel).HasMaxLength(100);
                e.HasIndex(x => x.DieName);
                e.HasIndex(x => x.RaceOrSpecies);
                e.HasIndex(x => x.Role);
                e.HasIndex(x => x.StatusID);
                e.HasIndex(x => x.SourceSheet);
            });
            modelBuilder.Entity<DinoTaxonomyNode>(e =>
            {
                e.ToTable("DinoTaxonomyNodes");
                e.HasKey(x => x.Id);
                e.Property(x => x.Rank).IsRequired().HasMaxLength(30);
                e.Property(x => x.Name).IsRequired().HasMaxLength(150);
                e.Property(x => x.Description).HasMaxLength(4000);
                e.Property(x => x.CreatedAtUtc).HasDefaultValueSql("SYSUTCDATETIME()");
                e.Property(x => x.UpdatedAtUtc).HasDefaultValueSql("SYSUTCDATETIME()");
                e.HasOne(x => x.Parent)
                    .WithMany(x => x.Children)
                    .HasForeignKey(x => x.ParentId)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => new { x.Rank, x.Name }).IsUnique();
                e.HasIndex(x => x.ParentId);
            });

            modelBuilder.Entity<DinosaurEntry>(e =>
            {
                e.ToTable("DinosaurEntries");
                e.HasKey(x => x.Id);
                e.Property(x => x.CommonName).IsRequired().HasMaxLength(200);
                e.Property(x => x.ScientificName).IsRequired().HasMaxLength(200);
                e.Property(x => x.Slug).IsRequired().HasMaxLength(220);
                e.Property(x => x.Clades).HasMaxLength(1000);
                e.Property(x => x.DiscoveryDate).HasMaxLength(100);
                e.Property(x => x.DiscoveredBy).HasMaxLength(300);
                e.Property(x => x.Description).HasMaxLength(8000);
                e.Property(x => x.CreatedAtUtc).HasDefaultValueSql("SYSUTCDATETIME()");
                e.Property(x => x.UpdatedAtUtc).HasDefaultValueSql("SYSUTCDATETIME()");
                e.HasOne(x => x.Kingdom).WithMany().HasForeignKey(x => x.KingdomId).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Phylum).WithMany().HasForeignKey(x => x.PhylumId).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Class).WithMany().HasForeignKey(x => x.ClassId).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Family).WithMany().HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Subfamily).WithMany().HasForeignKey(x => x.SubfamilyId).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Genus).WithMany().HasForeignKey(x => x.GenusId).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Species).WithMany().HasForeignKey(x => x.SpeciesId).OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => x.CommonName);
                e.HasIndex(x => x.ScientificName);
                e.HasIndex(x => x.Slug).IsUnique();
                e.HasIndex(x => x.IsPublished);
            });

            modelBuilder.Entity<DinoContentSection>(e =>
            {
                e.ToTable("DinoContentSections");
                e.HasKey(x => x.Id);
                e.Property(x => x.Heading).IsRequired().HasMaxLength(150);
                e.Property(x => x.Body).IsRequired().HasMaxLength(8000);
                e.HasOne(x => x.DinosaurEntry)
                    .WithMany(x => x.Sections)
                    .HasForeignKey(x => x.DinosaurEntryId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.DinosaurEntryId);
            });

            modelBuilder.Entity<DinoIllustration>(e =>
            {
                e.ToTable("DinoIllustrations");
                e.HasKey(x => x.Id);
                e.Property(x => x.ImageUrl).IsRequired().HasMaxLength(1000);
                e.Property(x => x.Caption).HasMaxLength(500);
                e.Property(x => x.Credit).HasMaxLength(300);
                e.HasOne(x => x.DinosaurEntry)
                    .WithMany(x => x.Illustrations)
                    .HasForeignKey(x => x.DinosaurEntryId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.DinosaurEntryId);
            });

            modelBuilder.Entity<AlcoholItem>(e =>
            {
                e.ToTable("AlcoholItems");
                e.HasKey(x => x.Id);
                e.Property(x => x.Category).IsRequired().HasMaxLength(50);
                e.Property(x => x.Name).IsRequired().HasMaxLength(200);
                e.Property(x => x.Producer).HasMaxLength(200);
                e.Property(x => x.Style).HasMaxLength(150);
                e.Property(x => x.Type).HasMaxLength(150);
                e.Property(x => x.Variety).HasMaxLength(150);
                e.Property(x => x.Color).HasMaxLength(50);
                e.Property(x => x.Country).HasMaxLength(100);
                e.Property(x => x.Region).HasMaxLength(150);
                e.Property(x => x.VintageOrYear).HasMaxLength(50);
                e.Property(x => x.Size).HasMaxLength(50);
                e.Property(x => x.Price).HasPrecision(18, 2);
                e.Property(x => x.Rating).HasPrecision(6, 2);
                e.Property(x => x.QuantityOnHand).HasPrecision(10, 2);
                e.Property(x => x.Location).HasMaxLength(100);
                e.Property(x => x.StatusID).IsRequired().HasMaxLength(5).HasDefaultValue("H");
                e.Property(x => x.Notes).HasMaxLength(2000);
                e.Property(x => x.SourceSheet).HasMaxLength(100);
                e.Property(x => x.SourceRowLabel).HasMaxLength(100);
                e.HasIndex(x => x.Category);
                e.HasIndex(x => x.Name);
                e.HasIndex(x => x.Location);
                e.HasIndex(x => x.StatusID);
                e.HasIndex(x => x.SourceSheet);
            });

            modelBuilder.Entity<AlcoholProduct>(e =>
            {
                e.ToTable("AlcoholProducts");
                e.HasKey(x => x.ID);
                e.Property(x => x.Product).IsRequired().HasMaxLength(200);
                e.Property(x => x.Producer).HasMaxLength(200);
                e.Property(x => x.Variety).HasMaxLength(150);
                e.Property(x => x.Color).HasMaxLength(50);
                e.Property(x => x.Country).HasMaxLength(100);
                e.Property(x => x.VintageOrYear).HasMaxLength(50);
                e.Property(x => x.Size).HasMaxLength(50);
                e.Property(x => x.Notes).HasMaxLength(2000);
                e.Property(x => x.SourceSheet).HasMaxLength(100);
                e.Property(x => x.SourceRowLabel).HasMaxLength(100);
                e.HasOne(x => x.Category)
                    .WithMany(x => x.Products)
                    .HasForeignKey(x => x.CategoryID)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasOne(x => x.Type)
                    .WithMany(x => x.Products)
                    .HasForeignKey(x => x.TypeID)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasOne(x => x.Style)
                    .WithMany(x => x.Products)
                    .HasForeignKey(x => x.StyleID)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasOne(x => x.Region)
                    .WithMany(x => x.Products)
                    .HasForeignKey(x => x.RegionID)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasIndex(x => x.Product);
                e.HasIndex(x => x.CategoryID);
                e.HasIndex(x => x.TypeID);
                e.HasIndex(x => x.StyleID);
                e.HasIndex(x => x.RegionID);
            });

            modelBuilder.Entity<AlcoholCategory>(e =>
            {
                e.ToTable("AlcoholCategory");
                e.HasKey(x => x.ID);
                e.Property(x => x.Category).IsRequired().HasMaxLength(50);
                e.HasIndex(x => x.Category).IsUnique();
            });

            modelBuilder.Entity<AlcoholType>(e =>
            {
                e.ToTable("AlcoholType");
                e.HasKey(x => x.ID);
                e.Property(x => x.Type).IsRequired().HasMaxLength(50);
                e.HasOne(x => x.Category)
                    .WithMany(x => x.Types)
                    .HasForeignKey(x => x.CategoryID)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasIndex(x => new { x.CategoryID, x.Type }).IsUnique();
            });

            modelBuilder.Entity<AlcoholStyle>(e =>
            {
                e.ToTable("AlcoholStyle");
                e.HasKey(x => x.ID);
                e.Property(x => x.Name).IsRequired().HasMaxLength(250);
                e.Property(x => x.Description).HasMaxLength(2000);
                e.HasOne(x => x.Type)
                    .WithMany(x => x.Styles)
                    .HasForeignKey(x => x.TypeID)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasIndex(x => new { x.TypeID, x.Name }).IsUnique();
            });

            modelBuilder.Entity<AlcoholRegion>(e =>
            {
                e.ToTable("AlcoholRegion");
                e.HasKey(x => x.ID);
                e.Property(x => x.Region).IsRequired().HasMaxLength(150);
                e.Property(x => x.Country).HasMaxLength(100);
                e.HasIndex(x => new { x.Country, x.Region }).IsUnique();
            });

            modelBuilder.Entity<AlcoholLocation>(e =>
            {
                e.ToTable("AlcoholLocation");
                e.HasKey(x => x.ID);
                e.Property(x => x.Location).IsRequired().HasMaxLength(100);
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.HasIndex(x => x.Location).IsUnique();
            });

            modelBuilder.Entity<AlcoholCount>(e =>
            {
                e.ToTable("AlcoholCount");
                e.HasKey(x => x.ID);
                e.Property(x => x.Qty).HasColumnType("decimal(10,2)");
                e.Property(x => x.StatusID).HasColumnName("wantStatusID").IsRequired().HasColumnType("char(1)").HasDefaultValue("H");
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.HasOne(x => x.Alcohol)
                    .WithMany(x => x.Counts)
                    .HasForeignKey(x => x.AlcoholID)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.Location)
                    .WithMany(x => x.Counts)
                    .HasForeignKey(x => x.LocationID)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasIndex(x => x.AlcoholID);
                e.HasIndex(x => x.LocationID);
                e.HasIndex(x => x.StatusID);
                e.HasIndex(x => new { x.AlcoholID, x.LocationID, x.StatusID });
            });

            modelBuilder.Entity<AlcoholRating>(e =>
            {
                e.ToTable("AlcoholRating");
                e.HasKey(x => x.ID);
                e.Property(x => x.Rating).HasPrecision(6, 2);
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.HasOne(x => x.Alcohol)
                    .WithMany(x => x.Ratings)
                    .HasForeignKey(x => x.AlcoholID)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.AlcoholID);
            });

            modelBuilder.Entity<AlcoholValue>(e =>
            {
                e.ToTable("AlcoholValue");
                e.HasKey(x => x.ID);
                e.Property(x => x.Price).HasColumnType("money");
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.HasOne(x => x.Alcohol)
                    .WithMany(x => x.Values)
                    .HasForeignKey(x => x.AlcoholID)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.AlcoholID);
                e.HasIndex(x => x.StoreID);
            });

            modelBuilder.Entity<GardenSeed>(e =>
            {
                e.ToTable("GardenSeed");
                e.HasKey(x => x.ID);
                e.Property(x => x.ID).ValueGeneratedOnAdd();
                e.Property(x => x.Name).IsRequired().HasMaxLength(50);
                e.HasIndex(x => x.Name);
            });

            modelBuilder.Entity<GardenSeedInventory>(e =>
            {
                e.ToTable("GardenSeedInventory");
                e.HasKey(x => x.SeedID);
            });

            modelBuilder.Entity<GardenSeedTray>(e =>
            {
                e.ToTable("GardenSeedTray");
                e.HasKey(x => x.ID);
                e.Property(x => x.ID).ValueGeneratedOnAdd();
                e.Property(x => x.TrayName).IsRequired().HasMaxLength(50);
                e.HasIndex(x => x.TrayName);
            });

            modelBuilder.Entity<GardenSeedTrayDimension>(e =>
            {
                e.ToTable("GardenSeedTrayDimensions");
                e.HasKey(x => x.ID);
                e.Property(x => x.ID).ValueGeneratedOnAdd();
                e.HasIndex(x => x.TrayID);
            });

            modelBuilder.Entity<GardenSeedTrayPlant>(e =>
            {
                e.ToTable("GardenSeedTrayPlants");
                e.HasKey(x => x.ID);
                e.Property(x => x.ID).ValueGeneratedOnAdd();
                e.Property(x => x.SeedId).HasColumnName("SeedId");
                e.HasIndex(x => x.TrayID);
                e.HasIndex(x => x.Year);
                e.HasIndex(x => x.TraySlotID);
                e.HasIndex(x => x.SeedId);
            });

            modelBuilder.Entity<GardenPlot>(e =>
            {
                e.ToTable("GardenPlot");
                e.HasKey(x => x.ID);
                e.Property(x => x.ID).ValueGeneratedOnAdd();
                e.Property(x => x.GardenName).IsRequired().HasMaxLength(50);
                e.HasIndex(x => x.GardenName);
            });

            modelBuilder.Entity<GardenPlotDimension>(e =>
            {
                e.ToTable("GardenPlotDimensions");
                e.HasKey(x => x.ID);
                e.Property(x => x.ID).ValueGeneratedOnAdd();
            });

            modelBuilder.Entity<GardenPlotPlant>(e =>
            {
                e.ToTable("GardenPlotPlants");
                e.HasKey(x => x.ID);
                e.Property(x => x.ID).ValueGeneratedOnAdd();
                e.HasIndex(x => x.GardenPlotID);
                e.HasIndex(x => x.Year);
                e.HasIndex(x => x.TraySlotID);
                e.HasIndex(x => x.SeedID);
            });

            modelBuilder.Entity<GardenNote>(e =>
            {
                e.ToTable("GardenNotes");
                e.HasKey(x => x.ID);
                e.Property(x => x.ID).ValueGeneratedOnAdd();
                e.HasIndex(x => x.GardenPlotID);
                e.HasIndex(x => x.Year);
            });

            modelBuilder.Entity<GardenHarvest>(e =>
            {
                e.ToTable("GardenHarvests");
                e.HasKey(x => x.ID);
                e.Property(x => x.ID).ValueGeneratedOnAdd();
                e.Property(x => x.Quantity).HasPrecision(10, 2);
                e.Property(x => x.Notes).HasMaxLength(2000);
                e.HasIndex(x => x.GardenPlotID);
                e.HasIndex(x => x.SeedID);
                e.HasIndex(x => x.HarvestDate);
                e.HasIndex(x => x.Year);
            });

            modelBuilder.Entity<ShowSeries>(e =>
            {
                e.ToTable("ShowSeries");
                e.HasKey(x => x.Id);
                e.Property(x => x.Title).IsRequired().HasMaxLength(200);
                e.Property(x => x.SortTitle).HasMaxLength(200);
                e.Property(x => x.Notes).HasMaxLength(2000);
                e.Property(x => x.CreatedAtUtc).HasDefaultValueSql("SYSUTCDATETIME()");
                e.Property(x => x.UpdatedAtUtc).HasDefaultValueSql("SYSUTCDATETIME()");
                e.HasIndex(x => x.Title);
                e.HasIndex(x => x.SortTitle);
                e.HasIndex(x => x.LegacyShowsToWatchId).IsUnique().HasFilter("[LegacyShowsToWatchId] IS NOT NULL");
            });

            modelBuilder.Entity<ShowSeason>(e =>
            {
                e.ToTable("ShowSeasons");
                e.HasKey(x => x.Id);
                e.Property(x => x.SeasonLabel).IsRequired().HasMaxLength(100);
                e.Property(x => x.StatusID).IsRequired().HasMaxLength(5).HasDefaultValue("H");
                e.Property(x => x.Format).HasMaxLength(50);
                e.Property(x => x.Notes).HasMaxLength(2000);
                e.Property(x => x.CreatedAtUtc).HasDefaultValueSql("SYSUTCDATETIME()");
                e.Property(x => x.UpdatedAtUtc).HasDefaultValueSql("SYSUTCDATETIME()");
                e.HasOne(x => x.Series)
                    .WithMany(x => x.Seasons)
                    .HasForeignKey(x => x.ShowSeriesId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.ShowSeriesId);
                e.HasIndex(x => x.StatusID);
                e.HasIndex(x => x.SeasonNumber);
                e.HasIndex(x => x.Format);
            });

            modelBuilder.Entity<ShowBoxSet>(e =>
            {
                e.ToTable("ShowBoxSets");
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).IsRequired().HasMaxLength(200);
                e.Property(x => x.StatusID).IsRequired().HasMaxLength(5).HasDefaultValue("H");
                e.Property(x => x.Format).HasMaxLength(50);
                e.Property(x => x.Notes).HasMaxLength(2000);
                e.Property(x => x.CreatedAtUtc).HasDefaultValueSql("SYSUTCDATETIME()");
                e.Property(x => x.UpdatedAtUtc).HasDefaultValueSql("SYSUTCDATETIME()");
                e.HasOne(x => x.Series)
                    .WithMany(x => x.BoxSets)
                    .HasForeignKey(x => x.ShowSeriesId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.ShowSeriesId);
                e.HasIndex(x => x.StatusID);
                e.HasIndex(x => x.Format);
            });

            modelBuilder.Entity<ShowBoxSetSeason>(e =>
            {
                e.ToTable("ShowBoxSetSeasons");
                e.HasKey(x => new { x.ShowBoxSetId, x.ShowSeasonId });
                e.HasOne(x => x.BoxSet)
                    .WithMany(x => x.Seasons)
                    .HasForeignKey(x => x.ShowBoxSetId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.Season)
                    .WithMany(x => x.BoxSetSeasons)
                    .HasForeignKey(x => x.ShowSeasonId)
                    .OnDelete(DeleteBehavior.NoAction);
                e.HasIndex(x => x.ShowSeasonId);
            });

            modelBuilder.Entity<AnnualPlan>(e =>
            {
                e.ToTable("AnnualPlans");
                e.HasKey(x => x.Id);
                e.Property(x => x.Title).IsRequired().HasMaxLength(250);
                e.Property(x => x.Status).IsRequired().HasMaxLength(25);
                e.Property(x => x.SourceSystem).HasMaxLength(50);
                e.Property(x => x.SourceFileName).HasMaxLength(260);
                e.HasIndex(x => x.Year).IsUnique();
                e.HasIndex(x => x.Status);
            });

            modelBuilder.Entity<FinanceAccountBalance>(e =>
            {
                e.ToTable("FinanceAccountBalances");
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).IsRequired().HasMaxLength(100);
                e.Property(x => x.Category).IsRequired().HasMaxLength(50);
                e.Property(x => x.Balance).HasPrecision(18, 2);
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.HasIndex(x => x.Category);
                e.HasIndex(x => new { x.IsActive, x.SortOrder });
            });

            modelBuilder.Entity<FinanceAccountBalanceHistory>(e =>
            {
                e.ToTable("FinanceAccountBalanceHistory");
                e.HasKey(x => x.Id);
                e.Property(x => x.Balance).HasPrecision(18, 2);
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.HasOne(x => x.FinanceAccountBalance)
                    .WithMany(x => x.History)
                    .HasForeignKey(x => x.FinanceAccountBalanceId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => new { x.FinanceAccountBalanceId, x.AsOfDate });
                e.HasIndex(x => x.RecordedAt);
            });

            modelBuilder.Entity<FinanceRecurringBill>(e =>
            {
                e.ToTable("FinanceRecurringBills");
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).IsRequired().HasMaxLength(100);
                e.Property(x => x.Category).IsRequired().HasMaxLength(50);
                e.Property(x => x.ExpectedAmount).HasPrecision(18, 2);
                e.Property(x => x.BillingIntervalMonths).HasDefaultValue(1);
                e.Property(x => x.StartMonth).HasDefaultValue(1);
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.HasIndex(x => new { x.IsActive, x.DueDay });
                e.HasIndex(x => new { x.IsActive, x.BillingIntervalMonths, x.StartMonth });
                e.HasIndex(x => x.Category);
            });

            modelBuilder.Entity<FinanceRecurringBillPayment>(e =>
            {
                e.ToTable("FinanceRecurringBillPayments");
                e.HasKey(x => x.Id);
                e.Property(x => x.AmountPaid).HasPrecision(18, 2);
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.HasOne(x => x.RecurringBill)
                    .WithMany(x => x.Payments)
                    .HasForeignKey(x => x.RecurringBillId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => new { x.RecurringBillId, x.Year, x.Month }).IsUnique();
                e.HasIndex(x => new { x.Year, x.Month, x.IsPaid });
            });

            modelBuilder.Entity<FinanceYearSnapshot>(e =>
            {
                e.ToTable("FinanceYearSnapshots");
                e.HasKey(x => x.Id);
                e.Property(x => x.TotalDebt).HasPrecision(18, 2);
                e.Property(x => x.TotalSavings).HasPrecision(18, 2);
                e.Property(x => x.Difference).HasPrecision(18, 2);
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.HasIndex(x => x.SnapshotDate).IsUnique();
            });

            modelBuilder.Entity<FinanceDonation>(e =>
            {
                e.ToTable("FinanceDonations");
                e.HasKey(x => x.Id);
                e.Property(x => x.Organization).IsRequired().HasMaxLength(150);
                e.Property(x => x.Amount).HasPrecision(18, 2);
                e.Property(x => x.Method).HasMaxLength(50);
                e.Property(x => x.ReceiptReference).HasMaxLength(500);
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.HasIndex(x => x.DonationDate);
                e.HasIndex(x => x.Organization);
            });

            modelBuilder.Entity<PlanItem>(e =>
            {
                e.ToTable("PlanItems");
                e.HasKey(x => x.Id);
                e.Property(x => x.Title).IsRequired().HasMaxLength(500);
                e.Property(x => x.ItemType).IsRequired().HasMaxLength(25);
                e.Property(x => x.Status).IsRequired().HasMaxLength(25);
                e.Property(x => x.PlanningWindowType)
                    .IsRequired()
                    .HasMaxLength(25)
                    .HasDefaultValue(PlanItemPlanningWindowTypes.Unscheduled);
                e.Property(x => x.ScheduleSurfaceMode)
                    .IsRequired()
                    .HasMaxLength(25)
                    .HasDefaultValue(PlanItemScheduleSurfaceModes.Never);
                e.Property(x => x.RolloverPolicy)
                    .IsRequired()
                    .HasMaxLength(25)
                    .HasDefaultValue(PlanItemRolloverPolicies.Normal);
                e.Property(x => x.TopLevelSection).HasMaxLength(250);
                e.Property(x => x.ImportedDuration).HasMaxLength(50);
                e.HasOne(x => x.AnnualPlan)
                    .WithMany(x => x.PlanItems)
                    .HasForeignKey(x => x.AnnualPlanId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.ParentPlanItem)
                    .WithMany(x => x.ChildPlanItems)
                    .HasForeignKey(x => x.ParentPlanItemId)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => new { x.AnnualPlanId, x.SortOrder });
                e.HasIndex(x => new { x.AnnualPlanId, x.TopLevelSection });
                e.HasIndex(x => x.ParentPlanItemId);
                e.HasIndex(x => x.SourceTaskUid);
                e.HasIndex(x => new { x.AnnualPlanId, x.PlanningWindowType });
                e.HasIndex(x => new { x.AnnualPlanId, x.TargetStartDate });
                e.HasIndex(x => new { x.AnnualPlanId, x.TargetEndDate });
            });

            modelBuilder.Entity<PlanItemPredecessor>(e =>
            {
                e.ToTable("PlanItemPredecessors");
                e.HasKey(x => x.Id);
                e.Property(x => x.DependencyType)
                    .IsRequired()
                    .HasMaxLength(2)
                    .HasDefaultValue(PlanItemDependencyTypes.FinishToStart);
                e.Property(x => x.ImportedLinkType).HasMaxLength(25);
                e.HasOne(x => x.PlanItem)
                    .WithMany(x => x.ImportedPredecessors)
                    .HasForeignKey(x => x.PlanItemId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.PredecessorPlanItem)
                    .WithMany(x => x.SuccessorDependencies)
                    .HasForeignKey(x => x.PredecessorPlanItemId)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => x.PlanItemId);
                e.HasIndex(x => x.PredecessorPlanItemId);
                e.HasIndex(x => new { x.PlanItemId, x.PredecessorPlanItemId })
                    .IsUnique()
                    .HasFilter("[PredecessorPlanItemId] IS NOT NULL");
                e.HasIndex(x => x.PredecessorSourceTaskUid);
            });

            modelBuilder.Entity<MagazineSeries>(e =>
            {
                e.ToTable("MagazinesSeries");
                e.HasKey(x => x.ID);
                e.Property(x => x.Title).IsRequired().HasMaxLength(100);
                e.HasIndex(x => x.Title);
            });

            modelBuilder.Entity<Magazine>(e =>
            {
                e.ToTable("Magazines");
                e.HasKey(x => x.ID);
                e.Property(x => x.Season).HasMaxLength(6);
                e.Property(x => x.Title).HasMaxLength(50);
                e.Property(x => x.StatusID).IsRequired().HasMaxLength(1);
                e.Property(x => x.CoverID).HasColumnType("nchar(1)");
                e.HasOne(x => x.Series)
                    .WithMany(x => x.Magazines)
                    .HasForeignKey(x => x.SeriesId)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => x.SeriesId);
                e.HasIndex(x => x.StatusID);
                e.HasIndex(x => x.Year);
                e.HasIndex(x => x.Number);
                e.HasIndex(x => x.Special);
                e.HasIndex(x => x.Alternate);
            });

            modelBuilder.Entity<MovieInventoryItem>(e =>
            {
                e.ToTable("MovieInventoryItems");
                e.HasKey(x => x.Id);
                e.Property(x => x.Title).IsRequired().HasMaxLength(250);
                e.Property(x => x.Creator).HasMaxLength(250);
                e.Property(x => x.Format).IsRequired().HasMaxLength(50);
                e.Property(x => x.WantStatusID).IsRequired().HasColumnType("char(1)").HasMaxLength(1);
                e.Property(x => x.ReleaseYear).HasMaxLength(25);
                e.Property(x => x.Barcode).HasMaxLength(64);
                e.Property(x => x.Source).HasMaxLength(100);
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.HasIndex(x => x.Title);
                e.HasIndex(x => x.Barcode);
                e.HasIndex(x => x.Format);
                e.HasIndex(x => x.WantStatusID);
            });

            modelBuilder.Entity<ComicSeries>(e =>
            {
                e.ToTable("ComicSeries");
                e.HasKey(x => x.ID);
                e.Property(x => x.Title).IsRequired().HasMaxLength(250);
                e.HasIndex(x => x.Title);
            });

            modelBuilder.Entity<ComicIssue>(e =>
            {
                e.ToTable("ComicIssue");
                e.HasKey(x => x.ID);
                e.Property(x => x.Name).HasMaxLength(250);
                e.Property(x => x.IssueYear).HasColumnType("char(4)").HasMaxLength(4);
                e.HasOne(x => x.Series)
                    .WithMany(x => x.Issues)
                    .HasForeignKey(x => x.SeriesID)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => x.SeriesID);
                e.HasIndex(x => x.IssueNumber);
                e.HasIndex(x => x.IssueYear);
                e.HasIndex(x => x.isSpecial);
                e.HasIndex(x => x.isGraphicNovel);
                e.HasIndex(x => x.isVariant);
            });

            modelBuilder.Entity<ComicStatus>(e =>
            {
                e.ToTable("ComicStatus");
                e.HasKey(x => x.ID);
                e.Property(x => x.Rating).HasColumnType("decimal(18,2)");
                e.Property(x => x.StatusID).IsRequired().HasColumnType("char(1)").HasMaxLength(1);
                e.HasOne(x => x.Issue)
                    .WithMany(x => x.Statuses)
                    .HasForeignKey(x => x.IssueID)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.IssueID);
                e.HasIndex(x => x.StatusID);
            });

            modelBuilder.Entity<ComicValue>(e =>
            {
                e.ToTable("ComicValue");
                e.HasKey(x => x.ID);
                e.Property(x => x.Price).HasColumnType("money");
                e.HasOne(x => x.Issue)
                    .WithMany(x => x.Values)
                    .HasForeignKey(x => x.IssueID)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.IssueID);
                e.HasIndex(x => x.StoredID);
            });

            modelBuilder.Entity<ToyCompany>(e =>
            {
                e.ToTable("ToyCompany");
                e.HasKey(x => x.ID);
                e.Property(x => x.Name).IsRequired().HasMaxLength(50);
                e.HasIndex(x => x.Name);
            });

            modelBuilder.Entity<ToyLine>(e =>
            {
                e.ToTable("ToyLine");
                e.HasKey(x => x.ID);
                e.Property(x => x.Name).IsRequired().HasMaxLength(50);
                e.HasOne(x => x.Company)
                    .WithMany(x => x.Lines)
                    .HasForeignKey(x => x.CompanyID)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasIndex(x => x.Name);
                e.HasIndex(x => x.CompanyID);
            });

            modelBuilder.Entity<ToySeries>(e =>
            {
                e.ToTable("ToySeries");
                e.HasKey(x => x.ID);
                e.Property(x => x.Name).IsRequired().HasMaxLength(50);
                e.HasIndex(x => x.Name);
            });

            modelBuilder.Entity<ToyLineSeries>(e =>
            {
                e.ToTable("ToyLineSeries");
                e.HasKey(x => new { x.LineID, x.SeriesID });
                e.HasOne(x => x.Line)
                    .WithMany(x => x.LineSeries)
                    .HasForeignKey(x => x.LineID)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.Series)
                    .WithMany(x => x.LineSeries)
                    .HasForeignKey(x => x.SeriesID)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ToyFigure>(e =>
            {
                e.ToTable("ToyFigures");
                e.HasKey(x => x.ID);
                e.Property(x => x.Name).IsRequired().HasMaxLength(50);
                e.Property(x => x.InBox).HasColumnName("inBox");
                e.Property(x => x.StatusID).HasColumnType("char(1)").HasMaxLength(1);
                e.HasOne(x => x.Line)
                    .WithMany(x => x.Figures)
                    .HasForeignKey(x => x.LineID)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Series)
                    .WithMany(x => x.Figures)
                    .HasForeignKey(x => x.SeriesID)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasIndex(x => x.Name);
                e.HasIndex(x => x.LineID);
                e.HasIndex(x => x.SeriesID);
                e.HasIndex(x => x.StatusID);
                e.HasIndex(x => x.InBox);
            });

            modelBuilder.Entity<Software>(e =>
            {
                e.ToTable("Software");
                e.HasKey(x => x.ID);
                e.Property(x => x.Title).IsRequired().HasMaxLength(50);
                e.Property(x => x.StatusID).HasColumnType("nchar(1)").HasMaxLength(1).IsFixedLength();
                e.Property(x => x.Publisher).HasMaxLength(100);
                e.Property(x => x.Developer).HasMaxLength(100);
                e.Property(x => x.VersionEdition).HasMaxLength(100);
                e.Property(x => x.MediaType).HasMaxLength(50);
                e.Property(x => x.SerialLicenseKeyNotes).HasMaxLength(1000);
                e.Property(x => x.Notes).HasMaxLength(2000);
                e.HasOne(x => x.Platform)
                    .WithMany(x => x.Software)
                    .HasForeignKey(x => x.PlatformID)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Location)
                    .WithMany(x => x.Software)
                    .HasForeignKey(x => x.LocationID)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasIndex(x => x.Title);
                e.HasIndex(x => x.StatusID);
                e.HasIndex(x => x.PlatformID);
                e.HasIndex(x => x.LocationID);
            });

            modelBuilder.Entity<SoftwarePlatform>(e =>
            {
                e.ToTable("SoftwarePlatform");
                e.HasKey(x => x.ID);
                e.Property(x => x.Platform).IsRequired().HasMaxLength(50);
                e.HasIndex(x => x.Platform);
            });

            modelBuilder.Entity<SoftwareLocation>(e =>
            {
                e.ToTable("SoftwareLocation");
                e.HasKey(x => x.ID);
                e.Property(x => x.Location).IsRequired().HasMaxLength(50);
                e.HasIndex(x => x.Location);
            });

            modelBuilder.Entity<MiniCompany>(e =>
            {
                e.ToTable("MiniCompany");
                e.HasKey(x => x.ID);
                e.Property(x => x.Company).IsRequired().HasMaxLength(50);
                e.HasIndex(x => x.Company);
            });

            modelBuilder.Entity<MiniSystem>(e =>
            {
                e.ToTable("MiniSystem");
                e.HasKey(x => x.ID);
                e.Property(x => x.System).IsRequired().HasMaxLength(50);
                e.HasOne(x => x.Company)
                    .WithMany(x => x.Systems)
                    .HasForeignKey(x => x.CompanyID)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => x.System);
                e.HasIndex(x => x.CompanyID);
            });

            modelBuilder.Entity<MiniSeries>(e =>
            {
                e.ToTable("MiniSeries");
                e.HasKey(x => x.ID);
                e.Property(x => x.Series).IsRequired().HasMaxLength(50);
                e.HasOne(x => x.System)
                    .WithMany(x => x.Series)
                    .HasForeignKey(x => x.SystemID)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => x.Series);
                e.HasIndex(x => x.SystemID);
            });

            modelBuilder.Entity<Miniature>(e =>
            {
                e.ToTable("Minis");
                e.HasKey(x => x.ID);
                e.Property(x => x.MiniName).IsRequired().HasMaxLength(100);
                e.Property(x => x.Num).HasMaxLength(12);
                e.Property(x => x.RarityID).HasMaxLength(50);
                e.Property(x => x.Subset).HasMaxLength(100);
                e.Property(x => x.Size).HasMaxLength(50);
                e.Property(x => x.Type).HasMaxLength(50);
                e.HasOne(x => x.Series)
                    .WithMany(x => x.Miniatures)
                    .HasForeignKey(x => x.SeriesID)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasIndex(x => x.MiniName);
                e.HasIndex(x => x.Num);
                e.HasIndex(x => x.SeriesID);
                e.HasIndex(x => x.RarityID);
                e.HasIndex(x => x.Subset);
                e.HasIndex(x => x.Size);
                e.HasIndex(x => x.Type);
            });

            modelBuilder.Entity<MiniStatus>(e =>
            {
                e.ToTable("MiniStatus");
                e.HasKey(x => x.ID);
                e.Property(x => x.StatusID).IsRequired().HasColumnType("nchar(1)").HasMaxLength(1).IsFixedLength();
                e.HasOne(x => x.Miniature)
                    .WithMany(x => x.Statuses)
                    .HasForeignKey(x => x.MiniID)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.MiniID);
                e.HasIndex(x => x.StatusID);
            });

            modelBuilder.Entity<MiniSystemRelease>(e =>
            {
                e.ToTable("MiniSystemRelease");
                e.HasKey(x => x.ID);
                e.Property(x => x.ReleaseName).IsRequired().HasMaxLength(50);
                e.Property(x => x.Year).HasColumnName("year");
                e.HasOne(x => x.System)
                    .WithMany()
                    .HasForeignKey(x => x.SystemID)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => x.SystemID);
            });

            modelBuilder.Entity<MiniValue>(e =>
            {
                e.ToTable("MiniValue");
                e.HasKey(x => x.ID);
                e.Property(x => x.MiniID).HasColumnName("miniID");
                e.Property(x => x.Price).HasColumnType("money");
                e.HasOne(x => x.Miniature)
                    .WithMany(x => x.Values)
                    .HasForeignKey(x => x.MiniID)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.MiniID);
                e.HasIndex(x => x.StoredID);
            });

            modelBuilder.Entity<Contact>(e =>
            {
                e.ToTable("Contacts");
                e.HasKey(x => x.Personid);
                e.Property(x => x.Personid).HasColumnName("Personid");
                e.Property(x => x.LastName).IsRequired().HasMaxLength(255).IsUnicode(false);
                e.Property(x => x.FirstName).IsRequired().HasMaxLength(255).IsUnicode(false);
                e.Property(x => x.City).HasMaxLength(50);
                e.Property(x => x.State).HasMaxLength(2);
                e.Property(x => x.Zip).HasColumnType("nchar(10)");
                e.Property(x => x.ContactType).HasColumnType("char(1)").HasMaxLength(1);
                e.HasOne(x => x.ContactTypeLookup)
                    .WithMany(x => x.Contacts)
                    .HasForeignKey(x => x.ContactType)
                    .HasPrincipalKey(x => x.ContactTypeID)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => x.LastName);
                e.HasIndex(x => x.FirstName);
                e.HasIndex(x => x.ContactType);
                e.HasIndex(x => x.XmasCard);
            });

            modelBuilder.Entity<ContactPhone>(e =>
            {
                e.ToTable("Contacts_Phone");
                e.HasKey(x => x.ID);
                e.Property(x => x.Personid).HasColumnName("Personid");
                e.Property(x => x.Number).HasColumnName("number").IsRequired().HasMaxLength(15).IsUnicode(false);
                e.Property(x => x.PhoneName).HasColumnName("phoneName");
                e.Property(x => x.PhoneType).HasColumnName("phoneType").HasColumnType("char(1)").HasMaxLength(1);
                e.HasOne(x => x.Contact)
                    .WithMany(x => x.Phones)
                    .HasForeignKey(x => x.Personid)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.PhoneTypeLookup)
                    .WithMany(x => x.Phones)
                    .HasForeignKey(x => x.PhoneType)
                    .HasPrincipalKey(x => x.PhoneID)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => x.Personid);
                e.HasIndex(x => x.PhoneType);
            });

            modelBuilder.Entity<ContactEmail>(e =>
            {
                e.ToTable("Contacts_Email");
                e.HasKey(x => x.ID);
                e.Property(x => x.Personid).HasColumnName("Personid");
                e.Property(x => x.Email).HasColumnName("email").IsRequired();
                e.Property(x => x.EmailName).HasColumnName("emailName").IsRequired();
                e.HasOne(x => x.Contact)
                    .WithMany(x => x.Emails)
                    .HasForeignKey(x => x.Personid)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.Personid);
            });

            modelBuilder.Entity<ContactPhoneType>(e =>
            {
                e.ToTable("Contacts_PhoneType");
                e.HasKey(x => x.PhoneID);
                e.Property(x => x.PhoneID).HasColumnName("phoneID").HasColumnType("char(1)").HasMaxLength(1);
                e.Property(x => x.PhoneType).HasColumnName("phoneType").IsRequired().HasMaxLength(15).IsUnicode(false);
            });

            modelBuilder.Entity<ContactTypeLookup>(e =>
            {
                e.ToTable("ContactType");
                e.HasKey(x => x.ContactTypeID);
                e.Property(x => x.ContactTypeID).HasColumnType("char(1)").HasMaxLength(1);
                e.Property(x => x.ContactType).IsRequired().HasMaxLength(25);
            });

            modelBuilder.Entity<ChessexCategory>(e =>
            {
                e.ToTable("ChessexCategories");
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).IsRequired().HasMaxLength(100);
                e.HasIndex(x => x.Name).IsUnique();
                e.HasIndex(x => x.SortOrder);
            });

            modelBuilder.Entity<ChessexSetType>(e =>
            {
                e.ToTable("ChessexSetTypes");
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).IsRequired().HasMaxLength(100);
                e.Property(x => x.Description).HasMaxLength(250);
                e.HasIndex(x => x.Name).IsUnique();
                e.HasIndex(x => x.SortOrder);
            });

            modelBuilder.Entity<ChessexSet>(e =>
            {
                e.ToTable("ChessexSets");
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).IsRequired().HasMaxLength(150);
                e.Property(x => x.ProductCode).HasMaxLength(50);
                e.Property(x => x.Color).HasMaxLength(100);
                e.Property(x => x.Notes).HasMaxLength(500);
                e.Property(x => x.WantStatusID).IsRequired().HasColumnType("char(1)").HasMaxLength(1);
                e.HasOne(x => x.Category)
                    .WithMany(x => x.Sets)
                    .HasForeignKey(x => x.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.SetType)
                    .WithMany(x => x.Sets)
                    .HasForeignKey(x => x.SetTypeId)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => x.Name);
                e.HasIndex(x => x.ProductCode);
                e.HasIndex(x => x.CategoryId);
                e.HasIndex(x => x.SetTypeId);
                e.HasIndex(x => x.WantStatusID);
            });

            modelBuilder.Entity<MtgCard>(e =>
            {
                e.ToTable("MtgCards");
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).IsRequired().HasMaxLength(250);
                e.Property(x => x.ManaCost).HasMaxLength(100);
                e.Property(x => x.Colors).HasMaxLength(20);
                e.Property(x => x.ColorIdentity).HasMaxLength(20);
                e.Property(x => x.TypeLine).HasMaxLength(250);
                e.Property(x => x.OracleText).HasMaxLength(2000);
                e.Property(x => x.Power).HasMaxLength(20);
                e.Property(x => x.Toughness).HasMaxLength(20);
                e.Property(x => x.Loyalty).HasMaxLength(20);
                e.Property(x => x.Legalities).HasMaxLength(1000);
                e.HasIndex(x => x.Name);
                e.HasIndex(x => x.Colors);
                e.HasIndex(x => x.ColorIdentity);
                e.HasIndex(x => x.TypeLine);
            });

            modelBuilder.Entity<MtgPrinting>(e =>
            {
                e.ToTable("MtgPrintings");
                e.HasKey(x => x.Id);
                e.Property(x => x.SetCode).IsRequired().HasMaxLength(20);
                e.Property(x => x.SetName).HasMaxLength(200);
                e.Property(x => x.CollectorNumber).IsRequired().HasMaxLength(30);
                e.Property(x => x.Rarity).HasMaxLength(30);
                e.Property(x => x.Artist).HasMaxLength(150);
                e.Property(x => x.ImageUrl).HasMaxLength(1000);
                e.Property(x => x.ScryfallId).HasMaxLength(100);
                e.Property(x => x.BorderColor).HasMaxLength(40);
                e.Property(x => x.Frame).HasMaxLength(40);
                e.Property(x => x.Finishes).HasMaxLength(100);
                e.HasOne(x => x.Card)
                    .WithMany(x => x.Printings)
                    .HasForeignKey(x => x.CardId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.CardId);
                e.HasIndex(x => x.SetCode);
                e.HasIndex(x => x.SetName);
                e.HasIndex(x => x.Rarity);
                e.HasIndex(x => x.ScryfallId);
                e.HasIndex(x => new { x.SetCode, x.CollectorNumber });
            });

            modelBuilder.Entity<MtgCollectionItem>(e =>
            {
                e.ToTable("MtgCollectionItems");
                e.HasKey(x => x.Id);
                e.Property(x => x.WantStatusID).IsRequired().HasColumnType("char(1)").HasMaxLength(1);
                e.Property(x => x.Condition).HasMaxLength(30);
                e.Property(x => x.Language).HasMaxLength(40);
                e.Property(x => x.Location).HasMaxLength(100);
                e.Property(x => x.Notes).HasMaxLength(1000);
                e.Property(x => x.EstimatedValue).HasColumnType("decimal(18,2)");
                e.HasOne(x => x.Printing)
                    .WithMany(x => x.CollectionItems)
                    .HasForeignKey(x => x.PrintingId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.PrintingId);
                e.HasIndex(x => x.WantStatusID);
                e.HasIndex(x => x.Condition);
                e.HasIndex(x => x.Language);
                e.HasIndex(x => x.Location);
            });

            modelBuilder.Entity<Book>(e =>
            {
                e.ToTable("Books");
                e.HasKey(x => x.ID);
                e.Property(x => x.Title).IsRequired().HasMaxLength(250);
                e.HasOne(x => x.Author)
                    .WithMany(x => x.Books)
                    .HasForeignKey(x => x.AuthorID)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Series)
                    .WithMany(x => x.Books)
                    .HasForeignKey(x => x.SeriesID)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasOne(x => x.SubSeries)
                    .WithMany(x => x.Books)
                    .HasForeignKey(x => x.SubSeriesID)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasOne(x => x.Status)
                    .WithOne(x => x.Book)
                    .HasForeignKey<BookStatus>(x => x.BooksID);
                e.HasIndex(x => x.Title);
                e.HasIndex(x => x.AuthorID);
                e.HasIndex(x => x.SeriesID);
                e.HasIndex(x => x.SubSeriesID);
            });

            modelBuilder.Entity<BookAuthor>(e =>
            {
                e.ToTable("BookAuthors");
                e.HasKey(x => x.ID);
                e.Property(x => x.LName).IsRequired().HasMaxLength(50);
                e.Property(x => x.Fname).HasMaxLength(50);
                e.Property(x => x.Middle).HasMaxLength(50);
            });

            modelBuilder.Entity<BookFormat>(e =>
            {
                e.ToTable("BookFormats");
                e.HasKey(x => x.ID);
                e.Property(x => x.Format).IsRequired().HasMaxLength(50);
            });

            modelBuilder.Entity<BookSeries>(e =>
            {
                e.ToTable("BookSeries");
                e.HasKey(x => x.ID);
                e.Property(x => x.Series).IsRequired().HasMaxLength(100);
            });

            modelBuilder.Entity<BookSubSeries>(e =>
            {
                e.ToTable("BookSubSeries");
                e.HasKey(x => x.ID);
                e.Property(x => x.SubSeries).IsRequired().HasMaxLength(100);
                e.HasOne(x => x.Series)
                    .WithMany(x => x.SubSeries)
                    .HasForeignKey(x => x.SeriesID)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<BookStatus>(e =>
            {
                e.ToTable("BookStatus");
                e.HasKey(x => x.ID);
                e.Property(x => x.WantStatusID).IsRequired().HasColumnType("char(1)").HasMaxLength(1);
                e.HasOne(x => x.Format)
                    .WithMany(x => x.BookStatuses)
                    .HasForeignKey(x => x.FormatID)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => x.WantStatusID);
                e.HasIndex(x => x.FormatID);
            });

            modelBuilder.Entity<BlogPost>(e =>
            {
                e.ToTable("BlogPosts");
                e.HasKey(x => x.Id);
                e.Property(x => x.Title).IsRequired().HasMaxLength(250);
                e.Property(x => x.Slug).IsRequired().HasMaxLength(250);
                e.Property(x => x.BodyMarkdown).IsRequired();
                e.Property(x => x.Status).IsRequired().HasMaxLength(25);
                e.HasIndex(x => x.Slug).IsUnique();
                e.HasIndex(x => x.PostedDate);
                e.HasIndex(x => x.Status);
                e.HasIndex(x => x.IsPublic);
            });

            modelBuilder.Entity<BlogTag>(e =>
            {
                e.ToTable("BlogTags");
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).IsRequired().HasMaxLength(100);
                e.Property(x => x.Slug).IsRequired().HasMaxLength(100);
                e.HasIndex(x => x.Name).IsUnique();
                e.HasIndex(x => x.Slug).IsUnique();
            });

            modelBuilder.Entity<BlogPostTag>(e =>
            {
                e.ToTable("BlogPostTags");
                e.HasKey(x => new { x.BlogPostId, x.BlogTagId });
                e.HasOne(x => x.BlogPost)
                    .WithMany(x => x.BlogPostTags)
                    .HasForeignKey(x => x.BlogPostId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.BlogTag)
                    .WithMany(x => x.BlogPostTags)
                    .HasForeignKey(x => x.BlogTagId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.BlogTagId);
            });

            modelBuilder.Entity<Recipe>(e =>
            {
                e.ToTable("RecipeEntries");
                e.HasKey(x => x.Id);
                e.Property(x => x.Title).IsRequired().HasMaxLength(250);
                e.Property(x => x.Description).HasMaxLength(500);
                e.Property(x => x.Category).IsRequired().HasMaxLength(100);
                e.Property(x => x.Cuisine).HasMaxLength(100);
                e.Property(x => x.SourceUrl).HasMaxLength(500);
                e.Property(x => x.SourcePage).HasMaxLength(100);
                e.Property(x => x.SourceDetail).HasMaxLength(500);
                e.Property(x => x.Notes).HasMaxLength(2000);
                e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                e.Property(x => x.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                e.HasIndex(x => x.Title);
                e.HasIndex(x => x.Category);
                e.HasIndex(x => x.Cuisine);
                e.HasIndex(x => x.RecipeBookId);
                e.HasIndex(x => x.IsCanning);
                e.HasIndex(x => x.IsFavorite);
                e.HasIndex(x => x.IsActive);
                e.HasIndex(x => x.LastUsedAt);
            });

            modelBuilder.Entity<RecipeBook>(e =>
            {
                e.ToTable("RecipeBooks", table => table.ExcludeFromMigrations());
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("ID");
                e.Property(x => x.Name).IsRequired().HasMaxLength(250);
                e.Property(x => x.Description);
                e.HasIndex(x => x.Name);
            });

            modelBuilder.Entity<RecipeIngredient>(e =>
            {
                e.ToTable("RecipeEntryIngredients");
                e.HasKey(x => x.Id);
                e.Property(x => x.ItemName).IsRequired().HasMaxLength(200);
                e.Property(x => x.Quantity).HasColumnType("decimal(10,2)");
                e.Property(x => x.Unit).HasMaxLength(50);
                e.Property(x => x.Preparation).HasMaxLength(250);
                e.Property(x => x.ShoppingCategory).IsRequired().HasMaxLength(80);
                e.HasOne(x => x.Recipe)
                    .WithMany(x => x.Ingredients)
                    .HasForeignKey(x => x.RecipeId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.RecipeId);
                e.HasIndex(x => x.ItemName);
                e.HasIndex(x => x.ShoppingCategory);
            });

            modelBuilder.Entity<RecipeInstruction>(e =>
            {
                e.ToTable("RecipeEntryInstructions");
                e.HasKey(x => x.Id);
                e.Property(x => x.Text).IsRequired().HasMaxLength(2000);
                e.HasOne(x => x.Recipe)
                    .WithMany(x => x.Instructions)
                    .HasForeignKey(x => x.RecipeId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.RecipeId);
            });

            modelBuilder.Entity<RecipeTag>(e =>
            {
                e.ToTable("RecipeFoodTags");
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).IsRequired().HasMaxLength(100);
                e.Property(x => x.Slug).IsRequired().HasMaxLength(100);
                e.HasIndex(x => x.Name).IsUnique();
                e.HasIndex(x => x.Slug).IsUnique();
            });

            modelBuilder.Entity<RecipeTagLink>(e =>
            {
                e.ToTable("RecipeFoodTagLinks");
                e.HasKey(x => new { x.RecipeId, x.RecipeTagId });
                e.HasOne(x => x.Recipe)
                    .WithMany(x => x.RecipeTagLinks)
                    .HasForeignKey(x => x.RecipeId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.RecipeTag)
                    .WithMany(x => x.RecipeTagLinks)
                    .HasForeignKey(x => x.RecipeTagId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.RecipeTagId);
            });

            modelBuilder.Entity<ResumeProfile>(e =>
            {
                e.ToTable("ResumeProfiles");
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).IsRequired().HasMaxLength(150);
                e.Property(x => x.Title).IsRequired().HasMaxLength(150);
                e.Property(x => x.Location).HasMaxLength(150);
                e.Property(x => x.Email).HasMaxLength(150);
                e.Property(x => x.Phone).HasMaxLength(50);
                e.Property(x => x.Website).HasMaxLength(250);
                e.Property(x => x.Summary).IsRequired();
            });

            modelBuilder.Entity<ResumeItem>(e =>
            {
                e.ToTable("ResumeItems");
                e.HasKey(x => x.Id);
                e.Property(x => x.Section).IsRequired().HasMaxLength(50);
                e.Property(x => x.Title).IsRequired().HasMaxLength(200);
                e.Property(x => x.Subtitle).HasMaxLength(200);
                e.Property(x => x.StartText).HasMaxLength(100);
                e.Property(x => x.EndText).HasMaxLength(100);
                e.Property(x => x.Location).HasMaxLength(150);
                e.HasIndex(x => x.Section);
                e.HasIndex(x => x.SortOrder);
                e.HasIndex(x => x.IsActive);
            });

            modelBuilder.Entity<BarcodeStagingItem>(e =>
            {
                e.ToTable("BarcodeStagingItems");
                e.HasKey(x => x.Id);
                e.Property(x => x.Upc).IsRequired().HasMaxLength(64);
                e.Property(x => x.NormalizedCode).IsRequired().HasMaxLength(64);
                e.Property(x => x.CodeType).IsRequired().HasMaxLength(25);
                e.Property(x => x.Source).IsRequired().HasMaxLength(25);
                e.Property(x => x.BatchName).HasMaxLength(50);
                e.Property(x => x.ItemType).IsRequired().HasMaxLength(25);
                e.Property(x => x.Status).IsRequired().HasMaxLength(25);
                e.Property(x => x.SuggestedTitle).HasMaxLength(250);
                e.Property(x => x.SuggestedCreator).HasMaxLength(250);
                e.Property(x => x.SuggestedFormat).HasMaxLength(100);
                e.Property(x => x.SuggestedYear).HasMaxLength(25);
                e.Property(x => x.LookupProvider).HasMaxLength(100);
                e.Property(x => x.ImportedEntityType).HasMaxLength(50);
                e.Property(x => x.Confidence).HasColumnType("decimal(5,2)");
                e.HasIndex(x => x.Upc);
                e.HasIndex(x => x.NormalizedCode);
                e.HasIndex(x => x.CodeType);
                e.HasIndex(x => x.Source);
                e.HasIndex(x => x.Status);
                e.HasIndex(x => x.ItemType);
                e.HasIndex(x => x.BatchName);
                e.HasIndex(x => new { x.ImportedEntityType, x.ImportedEntityId });
            });

            modelBuilder.Entity<BarcodeLookupCandidate>(e =>
            {
                e.ToTable("BarcodeLookupCandidates");
                e.HasKey(x => x.Id);
                e.Property(x => x.Provider).IsRequired().HasMaxLength(100);
                e.Property(x => x.ExternalId).HasMaxLength(100);
                e.Property(x => x.Title).HasMaxLength(250);
                e.Property(x => x.Creator).HasMaxLength(250);
                e.Property(x => x.Publisher).HasMaxLength(250);
                e.Property(x => x.PublishDate).HasMaxLength(50);
                e.Property(x => x.Format).HasMaxLength(100);
                e.Property(x => x.CoverImageUrl).HasMaxLength(500);
                e.Property(x => x.Confidence).HasColumnType("decimal(5,2)");
                e.HasOne(x => x.BarcodeStagingItem)
                    .WithMany(x => x.LookupCandidates)
                    .HasForeignKey(x => x.BarcodeStagingItemId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.BarcodeStagingItemId);
                e.HasIndex(x => x.Provider);
                e.HasIndex(x => x.Selected);
            });

            modelBuilder.Entity<Review>()
            .HasOne(r => r.Reviewer)
            .WithMany(u => u.Reviews)
            .HasForeignKey(r => r.ReviewerID)
            .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MusicAlbum>()
                .HasOne(a => a.Info)
                .WithOne(i => i.Album)
                .HasForeignKey<MusicAlbumInfo>(i => i.AlbumID);

            modelBuilder.Entity<MusicAlbum>()
                .HasOne(a => a.Status)
                .WithOne(s => s.Album)
                .HasForeignKey<MusicAlbumStatus>(s => s.AlbumID);

            modelBuilder.Entity<MusicAlbumStatus>(e =>
            {
                e.ToTable("MusicAlbumStatus");
                e.Property(s => s.FormatID).HasColumnType("char(2)").HasMaxLength(2);
                e.Property(s => s.WantStatusID).HasColumnType("char(1)").HasMaxLength(1);
                e.HasIndex(s => s.WantStatusID);
            });

            modelBuilder.Entity<MusicAlbumInfo>()
                .Property(i => i.Format)
                .HasMaxLength(25)
                .HasDefaultValue("CD");

            modelBuilder.Entity<MusicAlbum>()
                .HasOne(a => a.Band)
                .WithMany(b => b.Albums)
                .HasForeignKey(a => a.ArtistID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Link>()
                .HasOne(l => l.Topic)
                .WithMany(t => t.Links)
                .HasForeignKey(l => l.TopicID)
                .OnDelete(DeleteBehavior.NoAction); 

            modelBuilder.Entity<Link>()
                .HasOne(l => l.SubTopic)
                .WithMany(st => st.Links)
                .HasForeignKey(l => l.SubTopicID)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Location>()
            .ToTable("Location")
            .Property(l => l.LocationName)
            .HasColumnName("location");

            modelBuilder.Entity<HomeInventoryItem>()
                .ToTable("HomeInventoryItems")
                .HasOne(i => i.Room)
                .WithMany(r => r.Items)
                .HasForeignKey(i => i.RoomId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<HomeInventoryImage>()
                .ToTable("HomeInventoryImages")
                .HasOne(i => i.Item)
                .WithMany(i => i.Images)
                .HasForeignKey(i => i.ItemID);

            modelBuilder.Entity<HomeInventoryNote>()
                .ToTable("HomeInventoryNotes")
                .HasOne(n => n.Item)
                .WithMany(i => i.Notes)
                .HasForeignKey(n => n.ItemID);

            modelBuilder.Entity<Game>()
                .HasOne<Game>()
                .WithMany()
                .HasForeignKey(g => g.BaseGameID)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ScheduledTaskTag>()
                .HasKey(t => new { t.TaskID, t.Tag });
            modelBuilder.Entity<ScheduledTaskTag>()
                .HasOne(t => t.ScheduledTask)
                .WithMany(t => t.Tags)
                .HasForeignKey(t => t.TaskID);

            modelBuilder.Entity<FishTank>(e =>
            {
                e.ToTable("FishTanks");
                e.HasKey(tank => tank.Id);
                e.Property(tank => tank.Name).IsRequired().HasMaxLength(100);
                e.Property(tank => tank.Location).IsRequired().HasMaxLength(100);
                e.Property(tank => tank.Gallons).HasColumnType("decimal(8,2)");
                e.Property(tank => tank.Notes).HasMaxLength(500);
            });

            modelBuilder.Entity<FishTankLog>(e =>
            {
                e.ToTable("FishTankLogs");
                e.HasKey(log => log.Id);
                e.Property(log => log.LogType).IsRequired().HasMaxLength(50);
                e.Property(log => log.Temperature).HasColumnType("decimal(5,2)");
                e.Property(log => log.Ammonia).HasColumnType("decimal(6,2)");
                e.Property(log => log.Nitrite).HasColumnType("decimal(6,2)");
                e.Property(log => log.Nitrate).HasColumnType("decimal(6,2)");
                e.Property(log => log.Ph).HasColumnType("decimal(4,2)");
                e.Property(log => log.Gh).HasColumnType("decimal(6,2)");
                e.Property(log => log.Kh).HasColumnType("decimal(6,2)");
                e.Property(log => log.Notes).HasMaxLength(1000);
                e.HasOne(log => log.FishTank)
                    .WithMany(tank => tank.Logs)
                    .HasForeignKey(log => log.FishTankId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(log => log.FishTankId);
                e.HasIndex(log => log.LoggedAt);
                e.HasIndex(log => log.LogType);
            });

            modelBuilder.Entity<FishStock>(e =>
            {
                e.ToTable("FishStock");
                e.HasKey(stock => stock.Id);
                e.Property(stock => stock.CommonName).IsRequired().HasMaxLength(150);
                e.Property(stock => stock.ScientificName).HasMaxLength(150);
                e.Property(stock => stock.AdultSize).HasMaxLength(100);
                e.Property(stock => stock.Temperament).HasMaxLength(100);
                e.Property(stock => stock.TemperaturePreference).HasMaxLength(100);
                e.Property(stock => stock.PhPreference).HasMaxLength(100);
                e.Property(stock => stock.Notes).HasMaxLength(1000);
                e.HasOne(stock => stock.FishTank)
                    .WithMany(tank => tank.Stock)
                    .HasForeignKey(stock => stock.FishTankId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(stock => stock.FishTankId);
                e.HasIndex(stock => stock.CommonName);
                e.HasIndex(stock => stock.IsActive);
            });

            modelBuilder.Entity<FishSpeciesProfile>(e =>
            {
                e.ToTable("FishSpeciesProfiles");
                e.HasKey(profile => profile.Id);
                e.Property(profile => profile.CommonName).IsRequired().HasMaxLength(150);
                e.Property(profile => profile.ScientificName).HasMaxLength(150);
                e.Property(profile => profile.AdultSize).HasMaxLength(100);
                e.Property(profile => profile.Temperament).HasMaxLength(100);
                e.Property(profile => profile.TemperaturePreference).HasMaxLength(100);
                e.Property(profile => profile.PhPreference).HasMaxLength(100);
                e.Property(profile => profile.GhPreference).HasMaxLength(100);
                e.Property(profile => profile.KhPreference).HasMaxLength(100);
                e.Property(profile => profile.CareLevel).HasMaxLength(100);
                e.Property(profile => profile.TankLevel).HasMaxLength(100);
                e.Property(profile => profile.Notes).HasMaxLength(1000);
                e.HasIndex(profile => profile.CommonName);
                e.HasIndex(profile => profile.ScientificName);
            });

            modelBuilder.Entity<FishSpeciesFood>(e =>
            {
                e.ToTable("FishSpeciesFoods");
                e.HasKey(food => food.Id);
                e.Property(food => food.FoodName).IsRequired().HasMaxLength(150);
                e.Property(food => food.FoodType).HasMaxLength(100);
                e.Property(food => food.FeedingFrequency).HasMaxLength(100);
                e.Property(food => food.Notes).HasMaxLength(1000);
                e.HasOne(food => food.FishSpeciesProfile)
                    .WithMany(profile => profile.Foods)
                    .HasForeignKey(food => food.FishSpeciesProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(food => food.FishSpeciesProfileId);
                e.HasIndex(food => food.FoodName);
                e.HasIndex(food => food.IsStaple);
            });

            modelBuilder.Entity<FishTankTask>(e =>
            {
                e.ToTable("FishTankTasks");
                e.HasKey(task => task.Id);
                e.Property(task => task.TaskCategory).IsRequired().HasMaxLength(50);
                e.Property(task => task.Notes).HasMaxLength(1000);
                e.HasOne(task => task.FishTank)
                    .WithMany(tank => tank.Tasks)
                    .HasForeignKey(task => task.FishTankId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(task => task.ScheduledTask)
                    .WithMany()
                    .HasForeignKey(task => task.TaskId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(task => task.FishTankId);
                e.HasIndex(task => task.TaskId).IsUnique();
                e.HasIndex(task => task.TaskCategory);
            });

            modelBuilder.Entity<FishLivestockEvent>(e =>
            {
                e.ToTable("FishLivestockEvents");
                e.HasKey(ev => ev.Id);
                e.Property(ev => ev.EventType).IsRequired().HasMaxLength(50);
                e.Property(ev => ev.CommonName).IsRequired().HasMaxLength(150);
                e.Property(ev => ev.ScientificName).HasMaxLength(150);
                e.Property(ev => ev.Notes).HasMaxLength(1000);
                e.HasOne(ev => ev.FishTank)
                    .WithMany(tank => tank.LivestockEvents)
                    .HasForeignKey(ev => ev.FishTankId)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(ev => ev.DestinationFishTank)
                    .WithMany()
                    .HasForeignKey(ev => ev.DestinationFishTankId)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(ev => ev.FishTankId);
                e.HasIndex(ev => ev.DestinationFishTankId);
                e.HasIndex(ev => ev.EventDate);
                e.HasIndex(ev => ev.EventType);
                e.HasIndex(ev => ev.CommonName);
            });

            modelBuilder.Entity<FishAquariumProduct>(e =>
            {
                e.ToTable("FishAquariumProducts");
                e.HasKey(product => product.Id);
                e.Property(product => product.Name).IsRequired().HasMaxLength(150);
                e.Property(product => product.Category).IsRequired().HasMaxLength(50);
                e.Property(product => product.Quantity).HasColumnType("decimal(10,2)");
                e.Property(product => product.Unit).HasMaxLength(50);
                e.Property(product => product.PercentLeft).HasColumnType("decimal(5,2)");
                e.Property(product => product.Notes).HasMaxLength(1000);
                e.HasOne(product => product.FishTank)
                    .WithMany(tank => tank.AquariumProducts)
                    .HasForeignKey(product => product.FishTankId)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasIndex(product => product.FishTankId);
                e.HasIndex(product => product.Category);
                e.HasIndex(product => product.Name);
                e.HasIndex(product => product.ExpirationDate);
                e.HasIndex(product => product.IsActive);
            });

            modelBuilder.Entity<FishAquariumProductUsage>(e =>
            {
                e.ToTable("FishAquariumProductUsage");
                e.HasKey(usage => usage.Id);
                e.Property(usage => usage.UsageType).IsRequired().HasMaxLength(50);
                e.Property(usage => usage.QuantityUsed).HasColumnType("decimal(10,2)");
                e.Property(usage => usage.QuantityAfter).HasColumnType("decimal(10,2)");
                e.Property(usage => usage.PercentLeftAfter).HasColumnType("decimal(5,2)");
                e.Property(usage => usage.ShoppingCategory).IsRequired().HasMaxLength(50);
                e.Property(usage => usage.Notes).HasMaxLength(1000);
                e.HasOne(usage => usage.FishAquariumProduct)
                    .WithMany(product => product.UsageLogs)
                    .HasForeignKey(usage => usage.FishAquariumProductId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(usage => usage.FishAquariumProductId);
                e.HasIndex(usage => usage.UsedAt);
                e.HasIndex(usage => usage.UsageType);
                e.HasIndex(usage => usage.AddToShoppingList);
                e.HasIndex(usage => usage.ShoppingCategory);
            });

            modelBuilder.Entity<ShoppingListItem>(e =>
            {
                e.ToTable("ShoppingListItems");
                e.HasKey(item => item.Id);
                e.Property(item => item.ItemName).IsRequired().HasMaxLength(200);
                e.Property(item => item.Category).IsRequired().HasMaxLength(80);
                e.Property(item => item.Status).IsRequired().HasMaxLength(40);
                e.Property(item => item.Quantity).HasColumnType("decimal(10,2)");
                e.Property(item => item.Unit).HasMaxLength(50);
                e.Property(item => item.Store).HasMaxLength(100);
                e.Property(item => item.Aisle).HasMaxLength(100);
                e.Property(item => item.SourceArea).HasMaxLength(80);
                e.Property(item => item.SourceType).HasMaxLength(80);
                e.Property(item => item.Reason).HasMaxLength(300);
                e.Property(item => item.Notes).HasMaxLength(1000);
                e.Property(item => item.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                e.HasIndex(item => item.Category);
                e.HasIndex(item => item.Status);
                e.HasIndex(item => item.CreatedAt);
                e.HasIndex(item => new { item.Store, item.Aisle, item.SortOrder });
                e.HasIndex(item => new { item.SourceArea, item.SourceType, item.SourceId, item.Status });
            });

            modelBuilder.Entity<ShoppingItemDefault>(e =>
            {
                e.ToTable("ShoppingItemDefaults");
                e.HasKey(item => item.Id);
                e.Property(item => item.ItemName).IsRequired().HasMaxLength(200);
                e.Property(item => item.Category).IsRequired().HasMaxLength(80);
                e.Property(item => item.Quantity).HasColumnType("decimal(10,2)");
                e.Property(item => item.Unit).HasMaxLength(50);
                e.Property(item => item.Store).HasMaxLength(100);
                e.Property(item => item.Aisle).HasMaxLength(100);
                e.Property(item => item.Notes).HasMaxLength(1000);
                e.Property(item => item.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                e.Property(item => item.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                e.HasIndex(item => item.ItemName);
                e.HasIndex(item => item.Category);
                e.HasIndex(item => item.IsFrequent);
                e.HasIndex(item => new { item.Store, item.Aisle, item.SortOrder });
            });

            modelBuilder.Entity<PantryItem>(e =>
            {
                e.ToTable("PantryItems");
                e.HasKey(item => item.Id);
                e.Property(item => item.ItemName).IsRequired().HasMaxLength(200);
                e.Property(item => item.Category).IsRequired().HasMaxLength(80);
                e.Property(item => item.Quantity).HasColumnType("decimal(10,2)");
                e.Property(item => item.Unit).HasMaxLength(50);
                e.Property(item => item.Location).HasMaxLength(100);
                e.Property(item => item.Notes).HasMaxLength(1000);
                e.Property(item => item.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                e.Property(item => item.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                e.HasIndex(item => item.ItemName);
                e.HasIndex(item => item.Category);
                e.HasIndex(item => item.IsInStock);
                e.HasIndex(item => item.ExpirationDate);
            });

            modelBuilder.Entity<Spookytown>(e =>
            {
                e.ToTable("Spookytown");
                e.Property(x => x.Id).HasColumnName("ID");
                e.Property(x => x.Name).IsRequired().HasMaxLength(50);
                e.Property(x => x.SKU).HasMaxLength(50);
                e.Property(x => x.Url).HasColumnName("URL");
                e.Property(x => x.TypeId).HasColumnName("TypeID").HasColumnType("nchar(1)");
                e.HasOne(x => x.Type)
                 .WithMany(t => t.Items)
                 .HasForeignKey(x => x.TypeId);
            });

            modelBuilder.Entity<SpookytownType>(e =>
            {
                e.ToTable("SpookytownType");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("ID").HasColumnType("nchar(1)");
                e.Property(x => x.Type).IsRequired().HasMaxLength(50);
            });

            modelBuilder.Entity<AppSetting>(e =>
            {
                e.ToTable("AppSettings");
                e.HasKey(setting => setting.Key);
                e.Property(setting => setting.Key).HasMaxLength(150);
                e.Property(setting => setting.ValueJson).IsRequired();
                e.Property(setting => setting.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            });

            modelBuilder.Entity<RPGProduct>(e =>
            {
                e.ToTable("RPGProduct", "dbo");
                e.HasKey(x => x.ID);

                e.Property(x => x.ProductName).IsRequired().HasMaxLength(100);
                e.Property(x => x.Description).HasMaxLength(250);

                // If you keep NCHAR in SQL, EF can mark fixed length (optional)
                e.Property(x => x.ISBN).HasMaxLength(25).IsFixedLength(false);   // set true if your column is NCHAR(25)
                e.Property(x => x.Edition).HasMaxLength(25).IsFixedLength(false);

                // relationships (all optional FKs)
                e.HasOne(x => x.ProductType)
                    .WithMany(x => x.Products)
                    .HasForeignKey(x => x.ProductTypeID)
                    .OnDelete(DeleteBehavior.SetNull);

                e.HasOne(x => x.System)
                    .WithMany(x => x.Products)
                    .HasForeignKey(x => x.SystemID)
                    .OnDelete(DeleteBehavior.SetNull);

                e.HasOne(x => x.Series)
                    .WithMany(x => x.Products)
                    .HasForeignKey(x => x.SeriesID)
                    .OnDelete(DeleteBehavior.SetNull);

                // helpful indexes
                e.HasIndex(x => x.ProductName);
                e.HasIndex(x => x.SystemID);
                e.HasIndex(x => x.SeriesID);
                e.HasIndex(x => x.ProductTypeID);
            });

            // ---------- RPGProductType ----------
            modelBuilder.Entity<RPGProductType>(e =>
            {
                e.ToTable("RPGProductType", "dbo");
                e.HasKey(x => x.ID);
                e.Property(x => x.Type).IsRequired().HasMaxLength(100);
                e.Property(x => x.Description).HasMaxLength(250);
                e.HasIndex(x => x.Type).IsUnique();   // optional but handy
            });

            // ---------- RPGSystem ----------
            modelBuilder.Entity<RPGSystem>(e =>
            {
                e.ToTable("RPGSystem", "dbo");
                e.HasKey(x => x.ID);
                e.Property(x => x.Name).IsRequired().HasMaxLength(50);
                e.HasIndex(x => x.Name).IsUnique();   // optional
            });

            // ---------- RPGSeries ----------
            modelBuilder.Entity<RPGSeries>(e =>
            {
                e.ToTable("RPGSeries", "dbo");
                e.HasKey(x => x.ID);
                e.Property(x => x.SeriesName).IsRequired().HasMaxLength(50);
                e.HasIndex(x => x.SeriesName).IsUnique();  // optional
            });

            // ---------- RPGSystemNote ----------
            modelBuilder.Entity<RPGSystemNote>(e =>
            {
                e.ToTable("RPGSystemNotes", "dbo");   // matches your table name
                e.HasKey(x => x.ID);

                e.Property(x => x.Notes); // varchar(max)

                e.HasOne(x => x.System)
                    .WithMany(x => x.Notes)
                    .HasForeignKey(x => x.RPGSystemID)   // ensure this column exists
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasIndex(x => x.RPGSystemID);
            });

            // ---------- RPGSeriesNote ----------
            modelBuilder.Entity<RPGSeriesNote>(e =>
            {
                e.ToTable("RPGSeriesNotes", "dbo");   // matches your table name
                e.HasKey(x => x.ID);

                e.Property(x => x.Notes); // varchar(max)

                e.HasOne(x => x.Series)
                    .WithMany(x => x.Notes)
                    .HasForeignKey(x => x.RPGSeriesID)   // ensure this column exists
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasIndex(x => x.RPGSeriesID);
            });

            modelBuilder.Entity<AppUser>().HasIndex(u => u.Username).IsUnique();
            // Optional: add indexes or constraints here
        }
    }


}


