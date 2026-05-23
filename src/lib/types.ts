export interface MasterDataRow {
  legal_entity_code: string;
  legal_entity_name: string;
  department_code: string;
  department_name: string;
  profit_center_code: string;
  profit_center_name: string;
  cost_center_code: string;
  cost_center_name: string;
}

export interface ProfitCenterOption {
  id: number;
  code: string;
  name: string;
  department_name: string;
  legal_entity_name: string;
}

export interface PeriodConfig {
  type: "past" | "actual" | "planning";
  start_period: string;
  end_period: string;
}
