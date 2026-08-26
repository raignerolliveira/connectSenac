// frontend/js/utils.js
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

if (typeof window !== 'undefined') {
 window.escapeHTML = escapeHTML;
}
if (typeof module !== 'undefined' && module.exports) {
 module.exports = { escapeHTML };
}
