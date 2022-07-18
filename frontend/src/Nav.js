import React from 'react';

class MainNav extends React.Component {
	render() {
		return (
			<nav id='mainnav'>
				<section className='apptitle'>
					JuDE
				</section>
				<section className='nav'>
					<a className='nav' href='/'>
						home
					</a>
					<a className='nav' href='/explore/'>
						explore data
					</a>
				</section>
			</nav>
		)

	}
}

export default MainNav;

