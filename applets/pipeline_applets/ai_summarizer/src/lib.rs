// AI Summarizer Applet - Mock Implementation
// Returns demo summary for text input

#[no_mangle]
pub extern "C" fn summarize(text_ptr: *const u8, text_len: usize) -> *const u8 {
    let text = unsafe {
        let slice = std::slice::from_raw_parts(text_ptr, text_len);
        String::from_utf8_lossy(slice).to_string()
    };
    
    // Validate input length (max 5000 chars)
    if text.len() > 5000 {
        let error = "Error: Text exceeds 5000 character limit";
        return error.as_ptr();
    }
    
    // Return mock summary
    let summary = format!(
        "Summary: This text discusses key ideas related to blockchain applets and composability. Original length: {} characters.",
        text.len()
    );
    
    summary.as_ptr()
}
