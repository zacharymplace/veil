use url::Url;

const DANGEROUS_EXTENSIONS: &[&str] = &[
    "app", "bat", "bin", "cmd", "com", "dmg", "exe", "jar", "js", "msi", "pkg", "ps1", "scr", "sh",
    "vbs", "zip",
];

pub struct NavigationDecision {
    pub allowed: bool,
    pub reason: String,
}

/// HTTPS-only navigation policy, enforced natively for every navigation
/// inside the live WebView (including in-page link clicks, not just the
/// address the user typed).
pub fn decide_navigation(url: &str) -> NavigationDecision {
    match Url::parse(url) {
        Ok(parsed) if parsed.scheme() == "https" => NavigationDecision {
            allowed: true,
            reason: "Navigation allowed: HTTPS required and present.".to_string(),
        },
        Ok(_) => NavigationDecision {
            allowed: false,
            reason: "Navigation blocked: WebView requires HTTPS.".to_string(),
        },
        Err(_) => NavigationDecision {
            allowed: false,
            reason: "Navigation blocked: URL could not be parsed.".to_string(),
        },
    }
}

pub struct DownloadDecision {
    pub filename: String,
    pub extension: String,
    pub risk: String,
    pub reason: String,
}

fn filename_from_url(url: &str) -> String {
    Url::parse(url)
        .ok()
        .and_then(|parsed| {
            parsed
                .path_segments()
                .and_then(|mut segments| segments.next_back().map(str::to_string))
        })
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| "download".to_string())
}

fn extension_from_filename(filename: &str) -> String {
    if !filename.contains('.') {
        return String::new();
    }

    filename
        .rsplit('.')
        .next()
        .map(|extension| extension.to_lowercase())
        .unwrap_or_default()
}

fn risk_for_extension(extension: &str) -> &'static str {
    if extension.is_empty() {
        "medium"
    } else if DANGEROUS_EXTENSIONS.contains(&extension) {
        "high"
    } else {
        "low"
    }
}

/// Downloads are blocked by default for every profile today, so this
/// always blocks -- but still classifies the attempt for the audit
/// trail, matching the existing (previously simulated-only)
/// downloadRegistry.ts logic.
pub fn decide_download(url: &str) -> DownloadDecision {
    let filename = filename_from_url(url);
    let extension = extension_from_filename(&filename);
    let risk = risk_for_extension(&extension);

    let reason = if risk == "high" {
        format!("Blocked by default. .{extension} is a high-risk file type.")
    } else {
        "Downloads are blocked by default.".to_string()
    };

    DownloadDecision {
        filename,
        extension,
        risk: risk.to_string(),
        reason,
    }
}

#[cfg(test)]
mod tests {
    use super::{decide_download, decide_navigation};

    #[test]
    fn https_is_allowed() {
        let decision = decide_navigation("https://example.com");
        assert!(decision.allowed);
    }

    #[test]
    fn http_is_blocked() {
        let decision = decide_navigation("http://example.com");
        assert!(!decision.allowed);
    }

    #[test]
    fn unparseable_url_is_blocked() {
        let decision = decide_navigation("not a url");
        assert!(!decision.allowed);
    }

    #[test]
    fn other_schemes_are_blocked() {
        let decision = decide_navigation("file:///etc/passwd");
        assert!(!decision.allowed);
    }

    #[test]
    fn zip_is_classified_high_risk() {
        let decision = decide_download("https://example.com/file.zip");
        assert_eq!(decision.filename, "file.zip");
        assert_eq!(decision.extension, "zip");
        assert_eq!(decision.risk, "high");
    }

    #[test]
    fn png_is_classified_low_risk() {
        let decision = decide_download("https://example.com/image.png");
        assert_eq!(decision.risk, "low");
    }

    #[test]
    fn extensionless_url_is_classified_medium_risk() {
        let decision = decide_download("https://example.com/download");
        assert_eq!(decision.extension, "");
        assert_eq!(decision.risk, "medium");
    }

    #[test]
    fn filename_falls_back_when_path_is_empty() {
        let decision = decide_download("https://example.com/");
        assert_eq!(decision.filename, "download");
    }
}
