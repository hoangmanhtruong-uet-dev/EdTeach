import crypto from "crypto";

export interface CreatePaymentLinkParams {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
}

export interface PayOSPaymentLinkResult {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
}

export class PayOSService {
  private clientId: string;
  private apiKey: string;
  private checksumKey: string;
  private baseUrl = "https://api-merchant.payos.vn/v2/payment-requests";

  constructor() {
    this.clientId = process.env.PAYOS_CLIENT_ID || "";
    this.apiKey = process.env.PAYOS_API_KEY || "";
    this.checksumKey = process.env.PAYOS_CHECKSUM_KEY || "";
  }

  public isConfigured(): boolean {
    return Boolean(this.clientId && this.apiKey && this.checksumKey);
  }

  /**
   * Tạo chữ ký HMAC SHA256 cho yêu cầu thanh toán PayOS
   * Dữ liệu được sắp xếp theo thứ tự bảng chữ cái: amount, cancelUrl, description, orderCode, returnUrl
   */
  public createSignature(data: {
    amount: number;
    cancelUrl: string;
    description: string;
    orderCode: number;
    returnUrl: string;
  }): string {
    const rawStr = `amount=${data.amount}&cancelUrl=${data.cancelUrl}&description=${data.description}&orderCode=${data.orderCode}&returnUrl=${data.returnUrl}`;
    return crypto
      .createHmac("sha256", this.checksumKey)
      .update(rawStr)
      .digest("hex");
  }

  /**
   * Xác thực chữ ký webhook từ PayOS
   */
  public verifyWebhookData(webhookBody: {
    data: any;
    signature: string;
  }): boolean {
    if (!this.checksumKey) return false;
    const { data, signature } = webhookBody;
    if (!data || !signature) return false;

    // Sắp xếp các key trong data theo thứ tự A-Z
    const sortedKeys = Object.keys(data).sort();
    const signParts: string[] = [];

    for (const key of sortedKeys) {
      const val = data[key];
      if (val !== undefined && val !== null && val !== "") {
        signParts.push(`${key}=${val}`);
      }
    }

    const signStr = signParts.join("&");
    const expectedSignature = crypto
      .createHmac("sha256", this.checksumKey)
      .update(signStr)
      .digest("hex");

    return expectedSignature.toLowerCase() === signature.toLowerCase();
  }

  /**
   * Tạo Payment Link qua PayOS API
   */
  public async createPaymentLink(
    params: CreatePaymentLinkParams
  ): Promise<PayOSPaymentLinkResult> {
    if (!this.isConfigured()) {
      throw new Error("PayOS chưa được cấu hình đầy đủ Client ID, API Key hoặc Checksum Key.");
    }

    // PayOS giới hạn description tối đa 25 ký tự không dấu
    const sanitizedDesc = params.description
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .slice(0, 25);

    const signature = this.createSignature({
      amount: params.amount,
      cancelUrl: params.cancelUrl,
      description: sanitizedDesc,
      orderCode: params.orderCode,
      returnUrl: params.returnUrl,
    });

    const payload = {
      orderCode: params.orderCode,
      amount: params.amount,
      description: sanitizedDesc,
      returnUrl: params.returnUrl,
      cancelUrl: params.cancelUrl,
      signature,
      buyerName: params.buyerName,
      buyerEmail: params.buyerEmail,
      buyerPhone: params.buyerPhone,
    };

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "x-client-id": this.clientId,
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resData = await res.json();

    if (!res.ok || resData.code !== "00") {
      throw new Error(
        resData.desc || resData.message || "Không thể tạo liên kết thanh toán PayOS."
      );
    }

    return resData.data as PayOSPaymentLinkResult;
  }
}

export const payOSService = new PayOSService();
