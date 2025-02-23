import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import UserContextProvider from './Context/data-context';
import Navbar from './components/navbar/navbar';
import Home from './components/home/home';
import UserData from './components/user-data/user-data';
import SendEmails from './components/send-emails/send-emails';
import Footer from './components/Footer/footer'
import Analysis from './components/analysis/analysis';

function App() {
  return (
    <UserContextProvider>
      <Router>
        <Navbar/>
        <Routes>
          <Route element={<Home />} path='/' />
          <Route element={<Analysis />} path='/analysis' />
          <Route element={<UserData />} path='/user-data' />
          <Route element={<SendEmails />} path='/send-emails' />/
        </Routes>
       <Footer/>
      </Router>
    </UserContextProvider>
  );
}

export default App;