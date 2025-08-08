export const extractBook = ({ isbn, title, subtitle, authors = [], cover, description = '', publish_date }) => ({
  isbn,
  cover,
  title,
  subtitle,
  authors: authors.map(author => author.name),
  description,
  publishDate: publish_date
})

export const isDOI = string => {
  const regex = /\b(10[.][0-9]{4,}(?:[.][0-9]+)*\b)/g
  return regex.test(string)
}
