import { AiFillGithub } from "react-icons/ai";

function Footer() {
  return (
    <footer className="bg-lsecondary dark:bg-dsecondary border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between w-full px-6 py-2">
        <p>© 2023 All rights reserved</p>
        <a href="https://github.com/fluchtens/42-ft_transcendence">
          <button className="flex items-center justify-center w-6 h-6">
            <AiFillGithub className="w-6 h-6" />
          </button>
        </a>
      </div>
    </footer>
  );
}

export default Footer;
