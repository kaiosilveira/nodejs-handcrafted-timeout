export default interface XHRClientWrapper {
  get(url: string): Promise<any>;
}
