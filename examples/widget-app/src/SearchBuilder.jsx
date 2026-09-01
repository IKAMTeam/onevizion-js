import { OneVizionClient, search } from '@onevizion/sdk';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { SearchLg, PlusCircle, XClose } from '@untitledui/icons';
import { useEffect, useState } from 'react';
import { ComboBox, Input, Label, ListBox, ListBoxItem, Popover, Button as AriaButton } from 'react-aria-components';
import { ProxyHttpClient } from './proxyHttpClient';

// Flatten tree into list of trackor types
function flattenTree(node, list = []) {
  list.push({ name: node.name, label: node.label });
  if (node.children) {
    node.children.forEach((child) => flattenTree(child, list));
  }
  return list;
}

export function SearchBuilder() {
  const [client, setClient] = useState(null);
  const [trackorTypes, setTrackorTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [fields, setFields] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingFields, setLoadingFields] = useState(false);

  const [conditions, setConditions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // New condition form
  const [field, setField] = useState('');
  const [operator, setOperator] = useState('equal');
  const [value, setValue] = useState('');

  // Listen for auth from parent
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'WIDGET_AUTH') {
        const proxyHttp = new ProxyHttpClient(event.data.baseUrl);
        const newClient = {
          trackors: {
            getTree: () => proxyHttp.get('v3/trackor_tree'),
            search: (trackorType, query, options) => {
              const params = new URLSearchParams();
              if (options?.perPage) params.set('perPage', String(options.perPage));
              const path = `v3/trackor_types/${trackorType}/trackors/search${params.toString() ? '?' + params : ''}`;
              const searchExpression = typeof query === 'string' ? query : query.toString();
              return proxyHttp.post(path, searchExpression, { contentType: 'text/plain' });
            }
          },
          trackorTypes: {
            getViews: (trackorType) => proxyHttp.get(`v3/trackor_types/${trackorType}/views`),
            getView: (trackorType, viewName) => proxyHttp.get(`v3/trackor_types/${trackorType}/views/${viewName}`)
          }
        };
        setClient(newClient);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Load trackor types
  useEffect(() => {
    if (!client) return;

    const loadTypes = async () => {
      try {
        const tree = await client.trackors.getTree();
        const types = flattenTree(tree);
        setTrackorTypes(types);
      } catch (err) {
        console.error('Failed to load trackor types:', err);
      } finally {
        setLoadingTypes(false);
      }
    };
    loadTypes();
  }, [client]);

  // Load fields when results come back (use result fields as suggestions)
  useEffect(() => {
    if (results.length > 0 && results[0].fields) {
      const fieldNames = Object.keys(results[0].fields);
      setFields(fieldNames);
    }
  }, [results]);

  const addCondition = () => {
    if (!field) return;
    const needsValue = !['isNull', 'isNotNull', 'thisWeek', 'thisMonth'].includes(operator);
    if (needsValue && !value) return;

    setConditions([...conditions, { field, operator, value }]);
    setField('');
    setValue('');
  };

  const removeCondition = (idx) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const executeSearch = async () => {
    setLoading(true);
    try {
      let query;

      if (conditions.length > 0) {
        query = search();
        conditions.forEach((c, i) => {
          if (i > 0) query = query.and();
          switch (c.operator) {
            case 'equal': query = query.equal(c.field, c.value); break;
            case 'notEqual': query = query.notEqual(c.field, c.value); break;
            case 'greater': query = query.greater(c.field, parseFloat(c.value) || c.value); break;
            case 'less': query = query.less(c.field, parseFloat(c.value) || c.value); break;
            case 'isNull': query = query.isNull(c.field); break;
            case 'isNotNull': query = query.isNotNull(c.field); break;
            case 'thisWeek': query = query.thisWeek(c.field); break;
            case 'thisMonth': query = query.thisMonth(c.field); break;
          }
        });
      } else {
        query = '';
      }

      const data = await client.trackors.search(selectedType, query, { perPage: 1000 });
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // AG Grid columns
  const columns = results[0]?.fields ?
    Object.keys(results[0].fields).map(key => ({
      field: `fields.${key}`,
      headerName: key,
      sortable: true,
      filter: true,
      resizable: true,
    }))
    : [];

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Authenticating...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-gray-900">Search Builder</h1>
          <p className="text-lg text-gray-600 mt-2">Build and execute trackor searches</p>
        </div>

        {/* Step 1: Select Trackor Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Step 1: Select Trackor Type
          </h3>

          <ComboBox
            selectedKey={selectedType}
            onSelectionChange={setSelectedType}
            className="w-full"
          >
            <Label className="block text-sm font-medium text-gray-700 mb-2">Trackor Type</Label>
            <div className="relative">
              <Input className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <Popover className="w-[--trigger-width] bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-auto">
              <ListBox className="p-1">
                {trackorTypes.map((type) => (
                  <ListBoxItem
                    key={type.name}
                    id={type.name}
                    className="px-3 py-2 rounded cursor-pointer hover:bg-gray-100 focus:bg-blue-50 focus:outline-none"
                  >
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.name}</div>
                  </ListBoxItem>
                ))}
              </ListBox>
            </Popover>
          </ComboBox>
        </div>

        {/* Step 2: Build Search */}
        {selectedType && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Step 2: Add Conditions
            </h3>

            <div className="grid grid-cols-12 gap-4 mb-6">
              {/* Field Combobox */}
              <div className="col-span-4">
                <ComboBox
                  inputValue={field}
                  onInputChange={setField}
                  allowsCustomValue
                  className="w-full"
                >
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Field</Label>
                  <Input className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <Popover className="w-[--trigger-width] bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                    <ListBox className="p-1">
                      {fields.map((f) => (
                        <ListBoxItem
                          key={f}
                          id={f}
                          className="px-3 py-2 rounded cursor-pointer hover:bg-gray-100 focus:bg-blue-50 focus:outline-none"
                        >
                          {f}
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </Popover>
                </ComboBox>
              </div>

              {/* Operator */}
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Operator</label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="equal">Equal</option>
                  <option value="notEqual">Not Equal</option>
                  <option value="greater">Greater</option>
                  <option value="less">Less</option>
                  <option value="isNull">Is Null</option>
                  <option value="isNotNull">Is Not Null</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                </select>
              </div>

              {/* Value */}
              {!['isNull', 'isNotNull', 'thisWeek', 'thisMonth'].includes(operator) && (
                <div className="col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Add Button */}
              <div className={`${!['isNull', 'isNotNull', 'thisWeek', 'thisMonth'].includes(operator) ? 'col-span-1' : 'col-span-5'} flex items-end`}>
                <button
                  onClick={addCondition}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
                >
                  <PlusCircle className="w-5 h-5" />
                  Add
                </button>
              </div>
            </div>

            {/* Conditions List */}
            {conditions.length > 0 && (
              <div className="space-y-2 mb-6">
                <div className="text-sm font-medium text-gray-700 mb-3">Active Conditions:</div>
                {conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    {i > 0 && <span className="text-sm font-semibold text-blue-600 px-2">AND</span>}
                    <code className="flex-1 text-sm font-mono text-gray-800">{c.field} {c.operator} {c.value}</code>
                    <button
                      onClick={() => removeCondition(i)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <XClose className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Button */}
            <button
              onClick={executeSearch}
              disabled={loading}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-semibold text-lg shadow-sm"
            >
              <SearchLg className="w-6 h-6" />
              {loading ? 'Searching...' : conditions.length ? 'Search' : 'Load All Trackors'}
            </button>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Results ({results.length})
            </h3>
            <div className="ag-theme-alpine rounded-lg overflow-hidden" style={{ height: 500, width: '100%' }}>
              <AgGridReact
                rowData={results}
                columnDefs={columns}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                }}
                pagination={true}
                paginationPageSize={20}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
