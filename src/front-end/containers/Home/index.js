import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import formatMessage from '~/utils/formatMessage';
import { messages } from '../App/translation';
import { withStyles } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import SimpleMediaCard from './SimpleMediaCard';

const styles = theme => ({
  placeholder: {
    height: 40,
  },
  mainContainer: {
    margin: 8,
    [theme.breakpoints.up('sm')]: {
      margin: 40,
    },
  },
  cardContainer: {
    display: 'flex',
    flexWrap: 'wrap',
  },

  cardWrapper: {
    margin: 8,
  },
  icon: {
    fontSize: 24,
  },
  listFull: {
    width: 'auto',
  },
});

class Home extends React.Component {
  constructor(props){
    super(props);
  }

  render(){
    let { routeView, intl, greetName, classes } = this.props;

    return (
      <div className={classes.mainContainer}>
        <Typography variant="display3">
          Projects
        </Typography>
        <Divider />
        <div className={classes.placeholder} />
        { routeView }
      </div>
    );
  }
}

export default compose(
  connect(
    state => ({
      greetName: state.get('global').greetName,
    }),
  ),
  injectIntl,
  withStyles(styles),
)(Home);
