#[allow(dead_code)]
pub mod helpers {
    pub fn sanitize_branch_name(name: &str) -> String {
        name.replace(' ', "-").to_lowercase()
    }
}
