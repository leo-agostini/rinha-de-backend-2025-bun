import axios from "axios";
import IHttpClient from "../../types/http-client";

export default class HttpClient implements IHttpClient {
  constructor() {}

  async post(url: string, body: any): Promise<any> {
    return axios.post(url, body, {
      // signal: AbortSignal.timeout(1000),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
