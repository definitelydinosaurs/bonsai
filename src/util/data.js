export const extractBook = ({ isbn, title, subtitle, authors = [], cover, description = '' }) => ({
  isbn,
  cover,
  title,
  subtitle,
  authors: authors.map(author => author.name),
  description
})

export const isDOI = string => {
  const regex = /\b(10[.][0-9]{4,}(?:[.][0-9]+)*\b)/g
  return regex.test(string)
}
