export type ActionResult = {
  ok: boolean;
  title: string;
  body: string;
};

export type ResultPanelProps = {
  result: ActionResult;
};
