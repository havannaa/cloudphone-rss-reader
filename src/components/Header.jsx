import PropTypes from 'prop-types'
import './Header.css'

function Header({ title }) {
  return (
    <>
      <title>{title}</title>
      <header>
        <h1>{title}</h1>
      </header>
    </>
  )
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
};

export default Header
