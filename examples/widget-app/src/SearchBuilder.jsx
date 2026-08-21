import { OneVizionClient, search, widgetAuth } from '@onevizion/sdk';
import { useEffect, useState } from 'react';

// Flatten tree into list of trackor types
function flattenTree(node, list = []) {
  list.push({ name: node.name, label: node.label });
  if (node.children) {
    node.children.forEach((child) => flattenTree(child, list));
  }
  return list;
}

export function SearchBuilder() {
  const [authConfig, setAuthConfig] = useState(null);

  // Listen for token from parent loader
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'WIDGET_AUTH') {
        window.__WIDGET_AUTH_TOKEN__ = event.data.token;
        window.__WIDGET_BASE_URL__ = event.data.baseUrl;
        setAuthConfig({
          baseUrl: event.data.baseUrl,
          auth: { getToken: async () => event.data.token },
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const [client] = useState(() => {
    // Use pre-fetched token if already available
    const token = window.__WIDGET_AUTH_TOKEN__;
    const baseUrl = window.__WIDGET_BASE_URL__ || window.location.origin;

    return new OneVizionClient({
      baseUrl,
      auth: token ? { getToken: async () => token } : widgetAuth({ baseUrl }),
    });
  });

  // Update client when auth config arrives
  useEffect(() => {
    if (authConfig && client) {
      // Reinitialize with new auth
      Object.assign(client, new OneVizionClient(authConfig));
    }
  }, [authConfig, client]);

  const [trackorTypes, setTrackorTypes] = useState([]);
  const [trackorType, setTrackorType] = useState('');
  const [field, setField] = useState('STATUS');
  const [operator, setOperator] = useState('equal');
  const [value, setValue] = useState('');
  const [conditions, setConditions] = useState([]);
  const [results, setResults] = useState([]);
  const [queryString, setQueryString] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Load trackor types on mount
  useEffect(() => {
    const loadTypes = async () => {
      try {
        const tree = await client.trackors.getTree();
        const types = flattenTree(tree);
        setTrackorTypes(types);
        if (types.length > 0) {
          setTrackorType(types[0].name);
        }
      } catch (err) {
        console.error('Failed to load trackor types:', err);
        setError('Failed to load trackor types');
      } finally {
        setLoadingTypes(false);
      }
    };
    loadTypes();
  }, [client]);

  const addCondition = () => {
    const needsValue = !['isNull', 'isNotNull', 'thisWeek', 'thisMonth'].includes(operator);
    if (!field || (needsValue && !value)) return;

    setConditions([...conditions, { field, operator, value }]);
    setValue('');
  };

  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const executeSearch = async () => {
    if (conditions.length === 0) {
      setError('Add at least one condition');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = search();

      conditions.forEach((c, i) => {
        if (i > 0) query = query.and();

        switch (c.operator) {
          case 'equal':
            query = query.equal(c.field, c.value);
            break;
          case 'notEqual':
            query = query.notEqual(c.field, c.value);
            break;
          case 'greater':
            query = query.greater(c.field, parseFloat(c.value) || c.value);
            break;
          case 'less':
            query = query.less(c.field, parseFloat(c.value) || c.value);
            break;
          case 'isNull':
            query = query.isNull(c.field);
            break;
          case 'isNotNull':
            query = query.isNotNull(c.field);
            break;
          case 'thisWeek':
            query = query.thisWeek(c.field);
            break;
          case 'thisMonth':
            query = query.thisMonth(c.field);
            break;
        }
      });

      const queryStr = query.toString();
      setQueryString(queryStr);

      const data = await client.trackors.search(trackorType, query, { perPage: 10 });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setConditions([]);
    setResults([]);
    setQueryString('');
    setError(null);
  };

  return (
    <div className="container">
      <h1>OneVizion Search Builder</h1>
      <p style={{ color: '#666' }}>Build and execute trackor searches with visual query builder</p>

      <div className="card">
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Trackor Type:
        </label>
        {loadingTypes ? (
          <p>Loading trackor types...</p>
        ) : (
          <select
            value={trackorType}
            onChange={(e) => setTrackorType(e.target.value)}
            style={{ width: '300px', padding: '8px' }}
          >
            {trackorTypes.map((type) => (
              <option key={type.name} value={type.name}>
                {type.label} ({type.name})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Add Search Condition</h3>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={field}
            onChange={(e) => setField(e.target.value.toUpperCase())}
            placeholder="Field (e.g., STATUS)"
            style={{ flex: 1, minWidth: '150px' }}
          />

          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            style={{ minWidth: '150px' }}
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

          {!['isNull', 'isNotNull', 'thisWeek', 'thisMonth'].includes(operator) && (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Value"
              style={{ flex: 1, minWidth: '150px' }}
            />
          )}

          <button className="btn-primary" onClick={addCondition}>
            Add
          </button>
        </div>

        {conditions.length > 0 && (
          <div>
            <strong>Conditions:</strong>
            {conditions.map((c, i) => (
              <div className="condition" key={i}>
                <span style={{ flex: 1 }}>
                  {i > 0 && <strong style={{ color: '#666', marginRight: '5px' }}>AND</strong>}
                  <code>
                    {c.field} {c.operator} {c.value || ''}
                  </code>
                </span>
                <button
                  className="btn-danger"
                  onClick={() => removeCondition(i)}
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button
            className="btn-success"
            onClick={executeSearch}
            disabled={conditions.length === 0 || loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button className="btn-secondary" onClick={reset}>
            Reset
          </button>
        </div>
      </div>

      {queryString && (
        <div className="card">
          <strong>Generated Query:</strong>
          <pre>{queryString}</pre>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {results.length > 0 && (
        <div className="card">
          <h3>Results ({results.length})</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Fields</th>
              </tr>
            </thead>
            <tbody>
              {results.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.trackorType}</td>
                  <td>
                    <pre style={{ margin: 0, fontSize: '11px' }}>
                      {JSON.stringify(t.fields, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {queryString && !loading && !error && results.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#666' }}>
          No results found
        </div>
      )}
    </div>
  );
}
