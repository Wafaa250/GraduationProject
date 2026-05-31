using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("recommendation_semantic_embeddings")]
    public class RecommendationSemanticEmbedding
    {
        [Column("id")] public int Id { get; set; }
        [Column("scope_type")] public string ScopeType { get; set; } = string.Empty;
        [Column("scope_id")] public int ScopeId { get; set; }
        [Column("embedding_model")] public string EmbeddingModel { get; set; } = string.Empty;
        [Column("content_hash")] public string ContentHash { get; set; } = string.Empty;
        [Column("embedding_json")] public string EmbeddingJson { get; set; } = string.Empty;
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
