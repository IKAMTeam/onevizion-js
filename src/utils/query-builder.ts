/**
 * Query builder for OneVizion search API
 *
 * Provides a fluent, type-safe API for building search expressions.
 *
 * @example
 * ```typescript
 * import { search } from '@onevizion/sdk';
 *
 * // Simple query
 * const query = search()
 *   .equal('TOWER_HEIGHT', 40)
 *   .and()
 *   .equal('OWNER_NAME', 'John')
 *   .toString();
 * // -> "equal(TOWER_HEIGHT, 40) and equal(OWNER_NAME, \"John\")"
 *
 * // Complex query with grouping
 * const query = search()
 *   .group(q =>
 *     q.equal('STATUS', 'Active').or().equal('STATUS', 'Pending')
 *   )
 *   .and()
 *   .greater('CREATED_DATE', '2024-01-01')
 *   .toString();
 * // -> "(equal(STATUS, \"Active\") or equal(STATUS, \"Pending\")) and greater(CREATED_DATE, \"2024-01-01\")"
 * ```
 */

type SearchValue = string | number | boolean | Date | null;

export class SearchQuery {
  private parts: string[] = [];

  /**
   * equal(cf_name, value) or =(cf_name, value)
   */
  equal(field: string, value: SearchValue): this {
    this.parts.push(`equal(${field}, ${this.formatValue(value)})`);
    return this;
  }

  /**
   * not_equal(cf_name, value) or <>(cf_name, value)
   */
  notEqual(field: string, value: SearchValue): this {
    this.parts.push(`not_equal(${field}, ${this.formatValue(value)})`);
    return this;
  }

  /**
   * greater(cf_name, value) or >(cf_name, value)
   */
  greater(field: string, value: SearchValue): this {
    this.parts.push(`greater(${field}, ${this.formatValue(value)})`);
    return this;
  }

  /**
   * less(cf_name, value) or <(cf_name, value)
   */
  less(field: string, value: SearchValue): this {
    this.parts.push(`less(${field}, ${this.formatValue(value)})`);
    return this;
  }

  /**
   * greater_or_equal(cf_name, value) or >=(cf_name, value)
   */
  greaterOrEqual(field: string, value: SearchValue): this {
    this.parts.push(`greater_or_equal(${field}, ${this.formatValue(value)})`);
    return this;
  }

  /**
   * less_or_equal(cf_name, value) or <=(cf_name, value)
   */
  lessOrEqual(field: string, value: SearchValue): this {
    this.parts.push(`less_or_equal(${field}, ${this.formatValue(value)})`);
    return this;
  }

  /**
   * within(cf_name, value1, value2)
   */
  within(field: string, min: SearchValue, max: SearchValue): this {
    this.parts.push(`within(${field}, ${this.formatValue(min)}, ${this.formatValue(max)})`);
    return this;
  }

  /**
   * null(cf_name) or is_null(cf_name)
   */
  isNull(field: string): this {
    this.parts.push(`is_null(${field})`);
    return this;
  }

  /**
   * is_not_null(cf_name)
   */
  isNotNull(field: string): this {
    this.parts.push(`is_not_null(${field})`);
    return this;
  }

  /**
   * field_equal(cf1_name, cf2_name) or =F(cf1_name, cf2_name)
   */
  fieldEqual(field1: string, field2: string): this {
    this.parts.push(`field_equal(${field1}, ${field2})`);
    return this;
  }

  /**
   * field_not_equal(cf1_name, cf2_name) or <>F(cf1_name, cf2_name)
   */
  fieldNotEqual(field1: string, field2: string): this {
    this.parts.push(`field_not_equal(${field1}, ${field2})`);
    return this;
  }

  /**
   * field_greater(cf1_name, cf2_name) or >F(cf1_name, cf2_name)
   */
  fieldGreater(field1: string, field2: string): this {
    this.parts.push(`field_greater(${field1}, ${field2})`);
    return this;
  }

  /**
   * field_less(cf1_name, cf2_name) or <F(cf1_name, cf2_name)
   */
  fieldLess(field1: string, field2: string): this {
    this.parts.push(`field_less(${field1}, ${field2})`);
    return this;
  }

  /**
   * gt_today(cf_name, offset) or >=Today(cf_name, offset)
   * Use + or - for offset (e.g., +5 for 5 days from today, -3 for 3 days ago)
   */
  greaterThanToday(field: string, offset = 0): this {
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
    this.parts.push(`gt_today(${field}, ${offsetStr})`);
    return this;
  }

  /**
   * lt_today(cf_name, offset) or <=Today(cf_name, offset)
   */
  lessThanToday(field: string, offset = 0): this {
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
    this.parts.push(`lt_today(${field}, ${offsetStr})`);
    return this;
  }

  /**
   * this_week(cf_name, offset)
   */
  thisWeek(field: string, offset = 0): this {
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
    this.parts.push(`this_week(${field}, ${offsetStr})`);
    return this;
  }

  /**
   * this_month(cf_name, offset)
   */
  thisMonth(field: string, offset = 0): this {
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
    this.parts.push(`this_month(${field}, ${offsetStr})`);
    return this;
  }

  /**
   * this_quarter(cf_name, offset)
   */
  thisQuarter(field: string, offset = 0): this {
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
    this.parts.push(`this_quarter(${field}, ${offsetStr})`);
    return this;
  }

  /**
   * this_year(cf_name, offset)
   */
  thisYear(field: string, offset = 0): this {
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
    this.parts.push(`this_year(${field}, ${offsetStr})`);
    return this;
  }

  /**
   * this_week_to_date(cf_name)
   */
  thisWeekToDate(field: string): this {
    this.parts.push(`this_week_to_date(${field})`);
    return this;
  }

  /**
   * this_month_to_date(cf_name)
   */
  thisMonthToDate(field: string): this {
    this.parts.push(`this_month_to_date(${field})`);
    return this;
  }

  /**
   * this_quarter_to_date(cf_name)
   */
  thisQuarterToDate(field: string): this {
    this.parts.push(`this_quarter_to_date(${field})`);
    return this;
  }

  /**
   * this_year_to_date(cf_name)
   */
  thisYearToDate(field: string): this {
    this.parts.push(`this_year_to_date(${field})`);
    return this;
  }

  /**
   * equal_myself(cf_name) or =Myself(cf_name)
   */
  equalMyself(field: string): this {
    this.parts.push(`equal_myself(${field})`);
    return this;
  }

  /**
   * not_equal_myself(cf_name) or <>Myself(cf_name)
   */
  notEqualMyself(field: string): this {
    this.parts.push(`not_equal_myself(${field})`);
    return this;
  }

  /**
   * AND logical operator
   */
  and(): this {
    if (this.parts.length > 0) {
      this.parts.push('and');
    }
    return this;
  }

  /**
   * OR logical operator
   */
  or(): this {
    if (this.parts.length > 0) {
      this.parts.push('or');
    }
    return this;
  }

  /**
   * Group conditions with parentheses
   *
   * @example
   * ```typescript
   * search()
   *   .group(q => q.equal('A', 1).or().equal('B', 2))
   *   .and()
   *   .greater('C', 3)
   * // -> "(equal(A, 1) or equal(B, 2)) and greater(C, 3)"
   * ```
   */
  group(builder: (query: SearchQuery) => SearchQuery): this {
    const subQuery = builder(new SearchQuery());
    this.parts.push(`(${subQuery.toString()})`);
    return this;
  }

  /**
   * Add raw search expression (use with caution - no escaping applied)
   */
  raw(expression: string): this {
    this.parts.push(expression);
    return this;
  }

  /**
   * Format value for search query
   */
  private formatValue(value: SearchValue): string {
    if (value === null) {
      return 'null';
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (value instanceof Date) {
      // Format as ISO 8601 date or datetime
      const hasTime =
        value.getHours() !== 0 || value.getMinutes() !== 0 || value.getSeconds() !== 0;
      if (hasTime) {
        return `"${value.toISOString().slice(0, 19)}"`;
      }
      return `"${value.toISOString().slice(0, 10)}"`;
    }

    // String - escape double quotes and wrap in quotes
    const escaped = String(value).replace(/"/g, '\\"');
    return `"${escaped}"`;
  }

  /**
   * Build the final search query string
   */
  toString(): string {
    return this.parts.join(' ');
  }
}

/**
 * Create a new search query builder
 *
 * @example
 * ```typescript
 * const query = search()
 *   .equal('STATUS', 'Active')
 *   .and()
 *   .greater('AMOUNT', 100)
 *   .toString();
 * ```
 */
export function search(): SearchQuery {
  return new SearchQuery();
}
