export const extractBook = book => ({
  isbn: book.isbn,
  title: book.title,
  authors: book.authors,
  cover: book.cover.large || '',
  description: book.description || ''
})
