import errorLogo from "/error_page.svg";

function Error() {
  return (
    <main>
      <div className="flex flex-col items-center">
        <img src={errorLogo} alt="" className="" />
        <p className="text-6xl font-semibold">404 Not Found</p>
      </div>
    </main>
  );
}

export default Error;
