module.exports = {
  purge: ['./client/**/*.html', './client/**/*.jsx', './client/**/*.js'],
  theme: {
    backgroundColor: theme => ({
      ...theme('colors'),
      'primary': '#012d46',
      'secondary': '#387997',
      'danger': '#e3342f'
    }),
    textColor: theme => ({
      ...theme('colors'),
      'primary': '#ccffff',
      'secondary': '#387997',
      'danger': '#e3342f'
    })
  },
  variants: {},
  plugins: []
}