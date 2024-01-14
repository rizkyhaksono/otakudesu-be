import React from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Link, Button } from "@nextui-org/react";
import { OtakudesuLogo } from "@/app/otakudesu";
import { siteConfig } from "@/config/site";
import { ThemeSwitcher } from "./ThemeSwitcher";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} className="sm:hidden" />
        <NavbarBrand>
          <Link href="/" color="foreground">
            <OtakudesuLogo />
            <p className="font-bold text-inherit">Otakudesu API - RH</p>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4 text-sm" justify="center">
        {siteConfig.headerItems.map((item, index) => (
          <NavbarItem key={index}>
            <Link color="foreground" href={item.href} target="_blank">
              {item.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <Button as={Link} target="_blank" color="default" href="https://saweria.co/natee" variant="flat">
            Support
          </Button>
        </NavbarItem>
      </NavbarContent>
      <NavbarMenu>
        {siteConfig.headerItems.map((item, index) => (
          <NavbarMenuItem key={index}>
            <Link color="foreground">{item.label}</Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
      <ThemeSwitcher />
    </Navbar>
  );
}
