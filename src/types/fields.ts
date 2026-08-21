/**
 * Type-safe field value types for OneVizion
 */
export type TrackorFieldValue = string | number | boolean | null | Date;

/**
 * Generic trackor with typed custom fields
 *
 * @typeParam TFields - Shape of custom fields for this trackor type
 */
export interface Trackor<
  TFields extends Record<string, TrackorFieldValue> = Record<string, TrackorFieldValue>,
> {
  readonly id: number;
  readonly trackorType: string;
  readonly fields: TFields;
}

/**
 * Create trackor data with typed fields
 */
export interface CreateTrackorData<
  TFields extends Record<string, TrackorFieldValue> = Record<string, TrackorFieldValue>,
> {
  trackorType: string;
  fields: TFields;
}

/**
 * Update trackor data with partial typed fields
 */
export interface UpdateTrackorData<
  TFields extends Partial<Record<string, TrackorFieldValue>> = Partial<
    Record<string, TrackorFieldValue>
  >,
> {
  fields: TFields;
}
