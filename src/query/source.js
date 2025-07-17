import { invoke } from '@tauri-apps/api/core'

import request from '~/util/request'

export const getDOI = doi => ({
  queryKey: ['doi'],
  queryFn: () => request.get(`https://api.crossref.org/works/${doi}`),
  enabled: false
})

export const initializeData = {
  queryKey: ['state'],
  queryFn: () => invoke('dispatch', { event: 'initialize_data' }).then(JSON.parse)
}

export const getBook = (baseUrl, isbn) => ({
  queryKey: ['book'],
  queryFn: () => request.get(`${baseUrl}/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`),
  enabled: false
})

export const addBook = ({ refetch, setText }) => ({
  mutationFn: book => invoke('dispatch', { event: 'source_added', payload: JSON.stringify(book) }),
  onSuccess: () => {
    setText('')
    refetch()
  }
})

export const deleteBook = refetch => ({
  mutationFn: id => invoke('dispatch', { event: 'source_deleted', payload: id }),
  onSuccess: () => refetch()
})
