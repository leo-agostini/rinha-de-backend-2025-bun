export default interface IHttpClient {
  post: (url: string, body: any) => Promise<any>;
}
