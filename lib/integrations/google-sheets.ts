import { google } from 'googleapis';

let sheetsClient: any = null;

function getGoogleSheetsClient() {
  if (sheetsClient) return sheetsClient;

  if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY || 
      !process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
    console.log('Google Sheets API not configured, skipping');
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

export async function logOrderToGoogleSheets(orderData: {
  orderId: number;
  date: string;
  customerName: string;
  customerPhone: string;
  dessertName: string;
  quantity: number;
  totalPrice: string;
  agentName: string;
  status: string;
}) {
  const sheets = getGoogleSheetsClient();
  
  if (!sheets || !process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    console.log('Google Sheets not configured, skipping log');
    return;
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Orders!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          orderData.orderId,
          orderData.date,
          orderData.customerName,
          orderData.customerPhone,
          orderData.dessertName,
          orderData.quantity,
          orderData.totalPrice,
          orderData.agentName,
          orderData.status,
        ]],
      },
    });

    console.log('Order logged to Google Sheets successfully');
  } catch (error) {
    console.error('Error logging to Google Sheets:', error);
    throw error;
  }
}
