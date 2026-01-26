export default function Footer() {
    return (
        <footer className="py-3 px-8 text-center border-t border-gray-200 mt-auto bg-gray-50/50">
            <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} PahadiGo. All rights reserved.
            </p>
        </footer>
    );
}
