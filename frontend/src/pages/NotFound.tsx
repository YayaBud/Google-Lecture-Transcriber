import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";


const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Page not found</p>
        <Button variant="default" asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </div>
  )
}

export default NotFound
