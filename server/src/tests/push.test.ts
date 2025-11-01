import sendPushNotification from '../utils/push.js';
import fetch from 'node-fetch';

jest.mock('node-fetch', () => jest.fn());

const mockedFetch = fetch as unknown as jest.Mock;

describe('sendPushNotification', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it('returns parsed json result when fetch succeeds', async () => {
    mockedFetch.mockResolvedValue({ json: async () => ({ success: true }) });

    const res = await sendPushNotification('token123', 'Hello', 'World', { a: 1 });
    expect(res).toEqual({ success: true });
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('returns null when fetch throws', async () => {
    mockedFetch.mockRejectedValue(new Error('network'));

    const res = await sendPushNotification('token123', 'Hi', 'Fail');
    expect(res).toBeNull();
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });
});
