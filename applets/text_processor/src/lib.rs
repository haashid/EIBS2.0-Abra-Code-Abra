//! TextProcessor Applet - On-chain text processing
//! 
//! Simple WASM applet that can be deployed to WeilChain

use std::ffi::{CStr, CString};
use std::os::raw::c_char;

/// Allocate memory for FFI
#[no_mangle]
pub extern "C" fn alloc(len: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(len);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

/// Free memory for FFI
#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, len: usize) {
    unsafe {
        drop(Vec::from_raw_parts(ptr, 0, len));
    }
}

/// Count words in the given text
#[no_mangle]
pub extern "C" fn word_count(text_ptr: *const c_char) -> u64 {
    let text = unsafe { CStr::from_ptr(text_ptr).to_string_lossy() };
    text.split_whitespace().count() as u64
}

/// Count characters in the given text
#[no_mangle]
pub extern "C" fn char_count(text_ptr: *const c_char) -> u64 {
    let text = unsafe { CStr::from_ptr(text_ptr).to_string_lossy() };
    text.chars().count() as u64
}

/// Convert text to uppercase and return pointer
#[no_mangle]
pub extern "C" fn to_uppercase(text_ptr: *const c_char) -> *mut c_char {
    let text = unsafe { CStr::from_ptr(text_ptr).to_string_lossy() };
    let result = text.to_uppercase();
    CString::new(result).unwrap().into_raw()
}

/// Reverse the text and return pointer
#[no_mangle]
pub extern "C" fn reverse_text(text_ptr: *const c_char) -> *mut c_char {
    let text = unsafe { CStr::from_ptr(text_ptr).to_string_lossy() };
    let result: String = text.chars().rev().collect();
    CString::new(result).unwrap().into_raw()
}

/// Process text and return JSON result
#[no_mangle]
pub extern "C" fn process(text_ptr: *const c_char) -> *mut c_char {
    let text = unsafe { CStr::from_ptr(text_ptr).to_string_lossy() };
    
    let word_count = text.split_whitespace().count();
    let char_count = text.chars().count();
    let uppercase = text.to_uppercase();
    let reversed: String = text.chars().rev().collect();
    
    let json = format!(
        r#"{{"word_count":{},"char_count":{},"uppercase":"{}","reversed":"{}"}}"#,
        word_count, char_count, uppercase, reversed
    );
    
    CString::new(json).unwrap().into_raw()
}

/// Free a returned string
#[no_mangle]
pub extern "C" fn free_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        unsafe { drop(CString::from_raw(ptr)); }
    }
}
