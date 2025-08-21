# Epson ePOS SDK Setup Instructions

To use the Epson TM-m30III printer, you need to download and add the Epson ePOS SDK for JavaScript.

## Steps:

1. **Download the SDK:**
   - Go to the Epson Developer Portal: https://download.epson-biz.com/modules/pos/index.php
   - Download "ePOS-Print SDK for JavaScript"
   - Extract the downloaded file

2. **Add the SDK file:**
   - Copy `epos-2.27.0.js` (or the latest version) from the extracted SDK
   - Place it in the `public/` folder of this project
   - The file path should be: `public/epos-2.27.0.js`

3. **Printer Network Setup:**
   - Make sure your Epson TM-m30III is connected to the same WiFi network
   - Note the printer's IP address from the printer's network settings
   - The printer should be accessible on port 8008 (default ePOS port)

4. **Usage:**
   - The first time you print, you'll be prompted to enter the printer IP
   - The IP will be stored locally for future prints
   - The connection will be reused for subsequent prints

## Troubleshooting:

- Ensure the printer is on the same network as your device
- Check that port 8008 is accessible on the printer
- Try accessing `http://[PRINTER_IP]:8008/status` in your browser to test connectivity
- Make sure the ePOS service is enabled on the printer

## Supported Devices:
- iPhone Safari/Chrome
- Android Chrome
- Desktop browsers (for testing)