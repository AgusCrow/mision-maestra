using Microsoft.EntityFrameworkCore;

namespace MisionMaestra.API.Models
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<TeamMember> TeamMembers { get; set; }
        public DbSet<Task> Tasks { get; set; }
        public DbSet<TaskAssignment> TaskAssignments { get; set; }
        public DbSet<TeamInvitation> TeamInvitations { get; set; }
        public DbSet<Achievement> Achievements { get; set; }
        public DbSet<UserAchievement> UserAchievements { get; set; }
        public DbSet<ServerLog> ServerLogs { get; set; }
        public DbSet<OnlineUser> OnlineUsers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Password).IsRequired();
                entity.Property(e => e.TotalXP).HasDefaultValue(0);
                entity.Property(e => e.Level).HasDefaultValue(1);
                entity.Property(e => e.SocialBattery).HasDefaultValue(50);
            });

            // Configure Team entity
            modelBuilder.Entity<Team>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Leader)
                      .WithMany(e => e.CreatedTeams)
                      .HasForeignKey(e => e.LeaderId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure TeamMember entity
            modelBuilder.Entity<TeamMember>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.User)
                      .WithMany(e => e.TeamMemberships)
                      .HasForeignKey(e => e.UserId);
                entity.HasOne(e => e.Team)
                      .WithMany(e => e.Members)
                      .HasForeignKey(e => e.TeamId);
                entity.HasIndex(e => new { e.UserId, e.TeamId }).IsUnique();
            });

            // Configure Task entity
            modelBuilder.Entity<Task>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Creator)
                      .WithMany(e => e.Tasks)
                      .HasForeignKey(e => e.CreatorId);
                entity.HasOne(e => e.Team)
                      .WithMany(e => e.Tasks)
                      .HasForeignKey(e => e.TeamId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure TaskAssignment entity
            modelBuilder.Entity<TaskAssignment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Task)
                      .WithMany(e => e.Assignments)
                      .HasForeignKey(e => e.TaskId);
                entity.HasOne(e => e.User)
                      .WithMany(e => e.AssignedTasks)
                      .HasForeignKey(e => e.UserId);
                entity.HasIndex(e => new { e.TaskId, e.UserId }).IsUnique();
            });

            // Configure TeamInvitation entity
            modelBuilder.Entity<TeamInvitation>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Sender)
                      .WithMany(e => e.SentInvitations)
                      .HasForeignKey(e => e.SenderId);
                entity.HasOne(e => e.Receiver)
                      .WithMany(e => e.ReceivedInvitations)
                      .HasForeignKey(e => e.ReceiverId);
                entity.HasOne(e => e.Team)
                      .WithMany(e => e.Invitations)
                      .HasForeignKey(e => e.TeamId);
            });

            // Configure UserAchievement entity
            modelBuilder.Entity<UserAchievement>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.User)
                      .WithMany(e => e.Achievements)
                      .HasForeignKey(e => e.UserId);
                entity.HasOne(e => e.Achievement)
                      .WithMany(e => e.UserAchievements)
                      .HasForeignKey(e => e.AchievementId);
                entity.HasIndex(e => new { e.UserId, e.AchievementId }).IsUnique();
            });
        }
    }
}