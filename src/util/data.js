export const extractBook = ({ isbn, title, subtitle, authors = [], cover, description = '' }) => ({
  isbn,
  cover,
  title,
  subtitle,
  authors: authors.map(author => author.name),
  description
})
