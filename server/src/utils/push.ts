import fetch from 'node-fetch';

export async function sendPushNotification(pushToken: string, title: string, body: string, data?: any) {
  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    // return result so callers/tests can inspect
    return result;
  } catch (error) {
    // normalize to null on error to match previous behavior
    return null;
  }
}

export default sendPushNotification;
