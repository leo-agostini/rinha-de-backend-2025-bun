import axios from "axios";
import IHttpClient from "../types/http-client";

export default class HttpClient implements IHttpClient {
  constructor() {}

  post(url: string, body: any): Promise<any> {
    return axios.post(url, body, {
      signal: AbortSignal.timeout(101),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
