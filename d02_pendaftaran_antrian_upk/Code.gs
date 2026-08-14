/**
 * Code.gs — Entry point: routing doGet antara aplikasi utama dan layar display TV.
 */

const APP_TITLE = 'Pendaftaran & Antrian UPK Kemenkes';

function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) || 'index';

  if (page === 'display') {
    try {
      return HtmlService.createTemplateFromFile('Display')
        .evaluate()
        .setTitle('Layar Antrian — UPK Kemenkes')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (err) {
      return HtmlService.createHtmlOutput(
        '<h3 style="font-family:sans-serif;text-align:center;padding-top:40px;">' +
        'File "Display.html" belum ada di project Apps Script.<br>Unggah file tersebut lalu deploy ulang.</h3>'
      );
    }
  }

  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include template file lain (mis. Style, Script) secara modular.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
