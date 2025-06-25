export const extractBook = ({ isbn, title, subtitle, authors = [], cover, description = '' }) => ({
  isbn,
  title,
  subtitle,
  authors: authors.map(author => author.name),
  cover: cover?.large || cover || '',
  description
})
