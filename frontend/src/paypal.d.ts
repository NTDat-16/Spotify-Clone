export {};

declare global {
  interface Window {
    paypal: {
      Buttons: (options: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string; payerID: string }) => void;
        onCancel?: () => void;
        onError?: (err: any) => void;
      }) => {
        render: (container: string) => void;
      };
    };
  }
}