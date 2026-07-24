# CopyCookies Chrome Extension

Copy, Export, and Import all **Cookies**, **Local Storage**, and **Session Storage** used in the current tab.

You can invoke this extension using the extension icon or the shortcut key `Ctrl+Shift+K`. It functions similarly to the export feature of [EditThisCookie](http://editthiscookie.com/) but additionally supports modern storage mechanisms. The exported data, formatted in JSON, can be used for backups, debugging, transferring sessions between browser profiles, or parsing with automated tools like [puppeteer](https://github.com/puppeteer/puppeteer).

## Features

- 📋 **Copy to Clipboard:** Instantly format and copy the current tab's active data to your clipboard.
- ⬇️ **Export to File:** Download a structured `.json` data file containing all cookies, `localStorage`, and `sessionStorage`.
- ⬆️ **Import from File:** Seamlessly load an exported `.json` file back into any tab to instantly inject the stored state. 
- **Smart Expiration:** Imported cookies that have already passed their expiration date are automatically extended by 1 year, ensuring old session backups won't instantly delete themselves and get lost upon import.
- **Backward Compatibility:** Works flawlessly with old JSON files containing only arrays of cookies.

## Data Format

The extension uses a combined JSON object to store everything efficiently:

```json
{
  "cookies": [
    {
      "domain": ".example.com",
      "expirationDate": 1777466749.229935,
      "name": "_sess_id",
      "path": "/",
      "sameSite": "no_restriction",
      "secure": true,
      "session": false,
      "value": "abcd1234-5678-90ef-ghij-klmnopqrstuv"
    }
  ],
  "localStorage": {
    "theme": "dark",
    "user_id": "99318"
  },
  "sessionStorage": {
    "active_tab": "dashboard"
  }
}
```

## Privacy Policy

This extension requires the following permissions to function:

- **cookies**: To access, retrieve, and set cookies from the current tab.
- **scripting**: To temporarily run a script within the active tab to safely extract and inject `localStorage` and `sessionStorage`.
- **clipboardWrite**: To copy the data to your clipboard.
- **host_permissions**: To allow the extension to read and inject storage on any active site (`*://*/*`).  
  **Note:** This permission does not allow the extension to view your currently open websites in real time or monitor your traffic. It only runs localized scripts and retrieval methods when explicitly activated by the user.

### Data Collection

This extension does **not** collect, store, or transmit any user data. All operations are performed locally within your browser. The extension accesses the current tab only when explicitly triggered by the user. Any imported or exported data is strictly managed by your personal local file system.

## Security

This extension is open source. You can review the code in the [CopyCookies GitHub Repository](https://github.com/sammrai/copycookies.git) to ensure its safety. All operations are performed entirely within your local browser environment, and no data is transmitted to external servers.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](./LICENSE) file for details.