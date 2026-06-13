#[allow(dead_code)]
pub mod helpers {
    pub fn validate_repo_name(name: &str) -> bool {
        if name.is_empty() || name.len() > 100 {
            return false;
        }
        name.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_' || c == '.')
    }
}
