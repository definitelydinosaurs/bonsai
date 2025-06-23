export const extractBook = ({ isbn, title, authors = [], cover, description = '' }) => ({
  isbn,
  title,
  authors: authors.map(author => author.name),
  cover: cover?.large || cover || '',
  description
})
