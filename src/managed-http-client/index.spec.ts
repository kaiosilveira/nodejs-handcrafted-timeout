import ManagedHTTPClient from '.';

describe('ManagedHTTPClient', () => {
  const url = 'https://my-api.com/path/to/resource';

  it('should execute a GET request', async () => {
    const expectedResult = [{ id: 1, name: 'Kaio' }];
    const fakeGetFn = jest.fn();
    const http = { get: fakeGetFn };

    fakeGetFn.mockReturnValue(Promise.resolve(expectedResult));

    const client = new ManagedHTTPClient({ http, timeoutMs: 500 });
    const result = await client.get(url);

    expect(result).toEqual(expectedResult);
    expect(fakeGetFn).toHaveBeenCalledWith(url);
  });

  it('should throw a managed timeout error if request exceeds time limit', async () => {
    const timeoutMs = 500;
    const noop = () => {};
    const http = { get: () => new Promise(noop) };

    const client = new ManagedHTTPClient({ http, timeoutMs });

    await expect(client.get(url)).rejects.toEqual(
      `The requested operation timed out following the application's SLO of ${timeoutMs}.`
    );
  });
});
