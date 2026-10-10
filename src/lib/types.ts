export type EntryStatus = "CLEARED" | "PENDING";

export type ReceivingWithComputed = {
  id: number;
  sno: number;
  companyName: string | null;
  slipRingType: string;
  clientGpNo: string;
  clientGpDate: string;
  qtyReceived: number;
  location: string;
  remarks: string | null;
  isAdjustment: boolean;
  createdAt: string;
  dueOverride: number | null;
  totalDispatched: number;
  dueComputed: number;
  effectiveDue: number;
  status: EntryStatus;
};

export type DispatchWithReceiving = {
  id: number;
  receivingEntryId: number;
  internalGpNo: string;
  dispatchDate: string;
  dispatchQty: number;
  dispatchTo: string;
  remarks: string | null;
  createdAt: string;
  receivingEntry: {
    id: number;
    sno: number;
    companyName: string | null;
    slipRingType: string;
    clientGpNo: string;
  };
};

export type LogItem =
  | {
      kind: "receiving";
      id: number;
      createdAt: string;
      data: ReceivingWithComputed;
    }
  | {
      kind: "dispatch";
      id: number;
      createdAt: string;
      data: DispatchWithReceiving;
    };

// Company name -> slip ring type -> drums in stock. Entries without a company
// are grouped under "".
export type StockByCompany = Record<string, Record<string, number>>;

export type OrderDispatch = {
  id: number;
  internalGpNo: string;
  dispatchDate: string;
  dispatchQty: number;
  dispatchTo: string;
  remarks: string | null;
  createdAt: string;
};

// A receiving entry seen as an order: drums that came in and are tracked until
// every one of them is dispatched back.
export type Order = ReceivingWithComputed & { dispatches: OrderDispatch[] };

export type EntriesResponse = {
  orders: Order[];
  adjustments: ReceivingWithComputed[];
  activity: LogItem[];
  stockByCompany: StockByCompany;
  slipRingTypes: string[];
  companies: string[];
};

export type StockCeilingCheck = {
  companyName: string | null;
  slipRingType: string;
  currentStock: number;
  projectedStock: number;
  wouldExceed: boolean;
  deficit: number;
};
