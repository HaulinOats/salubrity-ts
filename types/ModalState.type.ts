export interface ModalState {
  content:
    | undefined
    | {
        title: string | undefined;
        message: string | undefined;
      };
  confirmation?: boolean;
  autoClose?: boolean;
}
export const ModalStateDefault = {
  content: undefined,
  confirmation: false,
  autoClose: false,
};
