export interface Modal {
  content:
    | undefined
    | {
        title: string;
        message: string;
      };
  confirmation: boolean;
  autoClose: boolean;
}
