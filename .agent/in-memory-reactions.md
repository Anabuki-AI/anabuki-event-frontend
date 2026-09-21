# In-memory projector reactions

The projector reaction polling contract is unchanged: each event still has `id`, `reaction`, and `reacted_at`, and cursors remain ISO-8601 timestamps. Only tournament-reset UI/audit fields were removed because reactions are no longer durable data.
