export const extractBook = ({ title, subtitle, authors = [], cover, description = '' }) => ({
  title,
  subtitle,
  authors: authors.map(author => author.name),
  cover: cover?.large || cover || '',
  description
})
