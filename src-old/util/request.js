const metadata = (method, data, headers = {}) => ({
  method,
  body: JSON.stringify(data),
  headers: { 'Content-Type': 'application/json', ...headers }
})

const res = res => res.ok
  ? res.json().then(d => d).catch(() => res.status)
  : Promise.reject(new Error(res))

export default {
  get: (url, headers = {}) => fetch(url, { headers }).then(res),
  ...['delete', 'patch', 'post', 'put'].reduce((acc, method) => ({
    ...acc,
    [method]: (url, body, headers = {}) => fetch(url, metadata(method, body, headers))
      .then(res)
  }), {})
}
